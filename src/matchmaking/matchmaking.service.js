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

        joinedAt: Date.now(),

        // Position, kept only for showing this player to their lobby-mates.
        x: 0,

        y: 0,

        z: 0,

        angle: 0,

        moving: false,

        training: false,

        inLobby: true,

        // Which stage's dino this player is wearing, so lobby-mates see the
        // real thing rather than a generic placeholder.
        evolutionIndex: 0

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
// UPDATE PLAYER POSITION
// --------------------------------------------------

function updatePlayerPosition(
    lobbyId,
    socketId,
    position
) {

    const lobby =
        lobbies.get(lobbyId);


    if (!lobby) {
        return null;
    }


    const player =
        lobby.players.find(
            player =>
                player.socketId === socketId
        );


    if (!player) {
        return null;
    }


    player.x = position.x;

    player.y = position.y;

    player.z = position.z;

    player.angle = position.angle;

    player.moving = position.moving;

    player.training = position.training;

    player.inLobby = position.inLobby;

    if (Number.isInteger(position.evolutionIndex)) {
        player.evolutionIndex = position.evolutionIndex;
    }


    return player;

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

                ready: player.ready,

                x: player.x ?? 0,

                y: player.y ?? 0,

                z: player.z ?? 0,

                angle: player.angle ?? 0,

                inLobby: player.inLobby !== false,

                evolutionIndex: player.evolutionIndex ?? 0,

                training: Boolean(player.training)

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

    updatePlayerPosition,

    startGame,

    deleteLobby,

    getLobbyData

};