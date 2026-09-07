const matchmakingService =
    require("./matchmaking.service");


const countdownTimers = new Map();


module.exports = function matchmakingSocket(
    io,
    socket
) {


    // ==================================================
    // JOIN MATCHMAKING
    // ==================================================

    socket.on(
        "join_matchmaking",
        (data) => {

            try {

                const username =
                    data?.username?.trim();


                if (!username) {

                    socket.emit(
                        "error_message",
                        {
                            message:
                                "Username is required"
                        }
                    );

                    return;
                }


                // --------------------------------------
                // Prevent joining twice
                // --------------------------------------

                if (socket.data.lobbyId) {

                    socket.emit(
                        "error_message",
                        {
                            message:
                                "You are already in a lobby"
                        }
                    );

                    return;
                }


                // --------------------------------------
                // Add player
                // --------------------------------------

                const lobby =
                    matchmakingService.addPlayer(
                        socket.id,
                        username
                    );


                // Store player information
                socket.data.lobbyId =
                    lobby.id;

                socket.data.username =
                    username;


                // Join Socket.IO room
                socket.join(lobby.id);


                console.log(
                    `[SOCKET] ${username} joined ${lobby.id}`
                );


                // --------------------------------------
                // Tell player match found
                // --------------------------------------

                socket.emit(
                    "match_found",
                    {
                        lobbyId: lobby.id,

                        playerId: socket.id
                    }
                );


                // --------------------------------------
                // Update lobby
                // --------------------------------------

                io.to(lobby.id).emit(
                    "lobby_updated",

                    matchmakingService
                        .getLobbyData(lobby)
                );


                // --------------------------------------
                // Lobby FULL
                // --------------------------------------

                if (
                    lobby.players.length ===
                    lobby.maxPlayers
                ) {

                    io.to(lobby.id).emit(
                        "lobby_full",
                        {
                            lobbyId:
                                lobby.id,

                            playerCount:
                                lobby.players.length
                        }
                    );


                    startCountdown(
                        io,
                        lobby.id
                    );

                }

            }
            catch (error) {

                console.error(
                    "Join matchmaking error:",
                    error
                );

            }

        }
    );


    // ==================================================
    // LEAVE LOBBY
    // ==================================================

    socket.on(
        "leave_lobby",
        () => {

            leaveLobby(
                io,
                socket
            );

        }
    );


};


// ======================================================
// COUNTDOWN
// ======================================================

function startCountdown(
    io,
    lobbyId
) {

    // Prevent duplicate countdown
    if (
        countdownTimers.has(lobbyId)
    ) {
        return;
    }


    let count = 3;


    const timer =
        setInterval(() => {

            const lobby =
                matchmakingService
                    .getLobby(lobbyId);


            // Lobby no longer exists
            if (!lobby) {

                clearInterval(timer);

                countdownTimers.delete(
                    lobbyId
                );

                return;
            }


            // ------------------------------------------
            // Someone left → cancel countdown
            // ------------------------------------------

            if (
                lobby.players.length === 0 ||
                lobby.players.length <
                    lobby.maxPlayers
            ) {

                clearInterval(timer);

                countdownTimers.delete(
                    lobbyId
                );


                lobby.status = "waiting";


                return;
            }


            // ------------------------------------------
            // Send countdown
            // ------------------------------------------

            io.to(lobbyId).emit(
                "game_countdown",
                {
                    count
                }
            );


            count--;


            // ------------------------------------------
            // Start game
            // ------------------------------------------

            if (count < 0) {

                clearInterval(timer);

                countdownTimers.delete(
                    lobbyId
                );


                const updatedLobby =
                    matchmakingService
                        .startGame(lobbyId);


                if (!updatedLobby) {
                    return;
                }


                io.to(lobbyId).emit(
                    "game_start",
                    {
                        lobbyId
                    }
                );


                console.log(
                    `[MATCHMAKING] Game started: ${lobbyId}`
                );

            }

        }, 1000);


    countdownTimers.set(
        lobbyId,
        timer
    );

}


// ======================================================
// LEAVE LOBBY
// ======================================================

function leaveLobby(
    io,
    socket
) {

    const lobbyId =
        socket.data.lobbyId;


    if (!lobbyId) {
        return;
    }


    const result =
        matchmakingService.removePlayer(
            socket.id
        );


    socket.leave(lobbyId);


    socket.data.lobbyId =
        null;


    // ----------------------------------------------
    // Lobby was deleted
    // ----------------------------------------------

    if (!result.lobby) {

        const timer =
            countdownTimers.get(
                lobbyId
            );


        if (timer) {

            clearInterval(timer);

            countdownTimers.delete(
                lobbyId
            );

        }


        return;
    }


    const lobby =
        result.lobby;


    // ----------------------------------------------
    // Notify remaining players
    // ----------------------------------------------

    io.to(lobby.id).emit(
        "player_left",
        {
            playerId:
                socket.id,

            username:
                result.removedPlayer
                    ?.username,

            playerCount:
                lobby.players.length
        }
    );


    // ----------------------------------------------
    // Update lobby
    // ----------------------------------------------

    io.to(lobby.id).emit(
        "lobby_updated",

        matchmakingService
            .getLobbyData(lobby)
    );

}


// ======================================================
// DISCONNECT HANDLER
// ======================================================

function handleDisconnect(
    io,
    socket
) {

    leaveLobby(
        io,
        socket
    );

}