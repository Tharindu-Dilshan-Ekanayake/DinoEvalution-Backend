const generateId = require("../utils/generateId");


const MAX_PLAYERS =
    Number(process.env.MAX_PLAYERS) || 8;


// Active lobbies
const lobbies = new Map();


// --------------------------------------------------
// CREATE LOBBY
// --------------------------------------------------

function createLobby() {

    const lobby = {

        id: generateId("lobby_"),

        players: [],

        maxPlayers: MAX_PLAYERS,

        status: "waiting",

        createdAt: Date.now()

    };


    lobbies.set(
        lobby.id,
        lobby
    );


    console.log(
        `[MATCHMAKING] Lobby created: ${lobby.id}`
    );


    return lobby;
}


// --------------------------------------------------
// FIND AVAILABLE LOBBY
// --------------------------------------------------

function findAvailableLobby() {

    for (const lobby of lobbies.values()) {

        if (
            lobby.status === "waiting" &&
            lobby.players.length < lobby.maxPlayers
        ) {

            return lobby;

        }

    }


    // No available lobby
    return createLobby();
}


// --------------------------------------------------
// ADD PLAYER
// --------------------------------------------------

function addPlayer(
    socketId,
    username
) {

    const lobby = findAvailableLobby();


    const player = {

        id: socketId,

        socketId: socketId,

        username: username,

        ready: false,

        joinedAt: Date.now()

    };


    lobby.players.push(player);


    // Lobby becomes full
    if (
        lobby.players.length >=
        lobby.maxPlayers
    ) {

        lobby.status = "full";

        console.log(
            `[MATCHMAKING] ${lobby.id} is FULL`
        );

    }


    console.log(
        `[MATCHMAKING] ${username} joined ${lobby.id}`
    );


    return lobby;
}


// --------------------------------------------------
// REMOVE PLAYER
// --------------------------------------------------

function removePlayer(socketId) {

    for (const lobby of lobbies.values()) {

        const playerIndex =
            lobby.players.findIndex(
                player =>
                    player.socketId === socketId
            );


        if (playerIndex === -1) {
            continue;
        }


        const removedPlayer =
            lobby.players[playerIndex];


        lobby.players.splice(
            playerIndex,
            1
        );


        console.log(
            `[MATCHMAKING] ${removedPlayer.username} left ${lobby.id}`
        );


        // ------------------------------------------
        // EMPTY LOBBY
        // ------------------------------------------

        if (lobby.players.length === 0) {

            lobbies.delete(lobby.id);


            console.log(
                `[MATCHMAKING] Lobby closed: ${lobby.id}`
            );


            return {
                lobby: null,
                removedPlayer
            };

        }


        // ------------------------------------------
        // FULL → WAITING
        // ------------------------------------------

        if (
            lobby.status === "full"
        ) {

            lobby.status = "waiting";

        }


        return {
            lobby,
            removedPlayer
        };

    }


    return {
        lobby: null,
        removedPlayer: null
    };
}


// --------------------------------------------------
// GET LOBBY
// --------------------------------------------------

function getLobby(lobbyId) {

    return lobbies.get(lobbyId);

}


// --------------------------------------------------
// GET ALL LOBBIES
// --------------------------------------------------

function getAllLobbies() {

    return Array.from(
        lobbies.values()
    );

}


// --------------------------------------------------
// START GAME
// --------------------------------------------------

function startGame(lobbyId) {

    const lobby =
        lobbies.get(lobbyId);


    if (!lobby) {
        return null;
    }


    lobby.status = "playing";


    return lobby;
}


// --------------------------------------------------
// DELETE LOBBY
// --------------------------------------------------

function deleteLobby(lobbyId) {

    return lobbies.delete(lobbyId);

}


// --------------------------------------------------
// LOBBY DATA FOR CLIENT
// --------------------------------------------------

function getLobbyData(lobby) {

    if (!lobby) {
        return null;
    }


    return {

        lobbyId: lobby.id,

        players: lobby.players.map(
            player => ({

                id: player.id,

                username: player.username,

                ready: player.ready

            })
        ),

        playerCount:
            lobby.players.length,

        maxPlayers:
            lobby.maxPlayers,

        status:
            lobby.status,

        createdAt:
            lobby.createdAt

    };

}


module.exports = {

    createLobby,

    findAvailableLobby,

    addPlayer,

    removePlayer,

    getLobby,

    getAllLobbies,

    startGame,

    deleteLobby,

    getLobbyData

};