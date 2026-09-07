const gameService =
    require("./game.service");

const matchmakingService =
    require("../matchmaking/matchmaking.service");


const gameLoops = new Map();


// ======================================================
// SOCKET CONNECTION
// ======================================================

module.exports = function gameSocket(
    io,
    socket
) {


    // ==================================================
    // PLAYER INPUT
    // ==================================================

    socket.on(
        "player_input",
        (input) => {

            const lobbyId =
                socket.data.lobbyId;


            if (!lobbyId) {
                return;
            }


            gameService.handlePlayerInput(
                lobbyId,
                socket.id,
                input
            );

        }
    );


    // ==================================================
    // GAME READY
    // ==================================================

    socket.on(
        "player_ready",
        () => {

            const lobbyId =
                socket.data.lobbyId;


            if (!lobbyId) {
                return;
            }


            const lobby =
                matchmakingService
                    .getLobby(lobbyId);


            if (!lobby) {
                return;
            }


            const player =
                lobby.players.find(
                    player =>
                        player.socketId ===
                        socket.id
                );


            if (!player) {
                return;
            }


            player.ready = true;


            io.to(lobbyId).emit(
                "lobby_updated",

                matchmakingService
                    .getLobbyData(lobby)
            );

        }
    );


    // ==================================================
    // START GAME
    // ==================================================

    socket.on(
        "game_start_request",
        () => {

            const lobbyId =
                socket.data.lobbyId;


            if (!lobbyId) {
                return;
            }


            const lobby =
                matchmakingService
                    .getLobby(lobbyId);


            if (!lobby) {
                return;
            }


            if (
                lobby.status !==
                "playing"
            ) {
                return;
            }


            // Prevent duplicate games
            if (
                gameService.getGame(
                    lobbyId
                )
            ) {

                return;

            }


            const game =
                gameService.createGame(
                    lobby
                );


            startGameLoop(
                io,
                lobbyId
            );


            io.to(lobbyId).emit(
                "game_initialized",
                {
                    gameId: game.id,

                    state:
                        gameService
                            .getGameState(
                                lobbyId
                            )
                }
            );

        }
    );

};


// ======================================================
// GAME LOOP
// ======================================================

function startGameLoop(
    io,
    lobbyId
) {

    if (
        gameLoops.has(lobbyId)
    ) {
        return;
    }


    let lastTime =
        Date.now();


    const interval =
        setInterval(() => {

            const now =
                Date.now();


            const deltaTime =
                (now - lastTime) /
                1000;


            lastTime = now;


            const game =
                gameService.getGame(
                    lobbyId
                );


            if (!game || !game.running) {

                clearInterval(interval);

                gameLoops.delete(
                    lobbyId
                );

                return;

            }


            // Update server game
            gameService.updateGame(
                lobbyId,
                deltaTime
            );


            // Send game state
            io.to(lobbyId).emit(
                "game_state",

                gameService
                    .getGameState(
                        lobbyId
                    )
            );


        }, 50); // 20 updates/sec


    gameLoops.set(
        lobbyId,
        interval
    );

}