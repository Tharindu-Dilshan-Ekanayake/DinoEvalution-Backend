const generateId =
    require("../utils/generateId");


const games = new Map();


// ======================================================
// CREATE GAME
// ======================================================

function createGame(lobby) {

    const game = {

        id: generateId("game_"),

        lobbyId: lobby.id,

        startedAt: Date.now(),

        gameTime: 0,

        tick: 0,

        running: true,

        players: {},

        obstacles: [],

        speed: 300

    };


    // Create player state
    lobby.players.forEach(player => {

        game.players[player.id] = {

            id: player.id,

            username: player.username,

            x: 100,

            y: 0,

            velocityY: 0,

            isJumping: false,

            score: 0,

            alive: true

        };

    });


    games.set(
        lobby.id,
        game
    );


    console.log(
        `[GAME] Game created: ${game.id}`
    );


    return game;
}


// ======================================================
// GET GAME
// ======================================================

function getGame(lobbyId) {

    return games.get(lobbyId);

}


// ======================================================
// REMOVE GAME
// ======================================================

function removeGame(lobbyId) {

    games.delete(lobbyId);

}


// ======================================================
// PLAYER INPUT
// ======================================================

function handlePlayerInput(
    lobbyId,
    playerId,
    input
) {

    const game =
        games.get(lobbyId);


    if (!game || !game.running) {
        return;
    }


    const player =
        game.players[playerId];


    if (!player || !player.alive) {
        return;
    }


    // ------------------------------------------
    // JUMP
    // ------------------------------------------

    if (
        input.action === "jump" &&
        !player.isJumping
    ) {

        player.velocityY = 700;

        player.isJumping = true;

    }

}


// ======================================================
// UPDATE GAME
// ======================================================

function updateGame(
    lobbyId,
    deltaTime
) {

    const game =
        games.get(lobbyId);


    if (!game || !game.running) {
        return;
    }


    game.tick++;

    game.gameTime += deltaTime;


    // ------------------------------------------
    // Update players
    // ------------------------------------------

    for (
        const player of
        Object.values(game.players)
    ) {

        if (!player.alive) {
            continue;
        }


        // Gravity
        player.velocityY -=
            1800 * deltaTime;


        player.y +=
            player.velocityY *
            deltaTime;


        // Ground
        if (player.y <= 0) {

            player.y = 0;

            player.velocityY = 0;

            player.isJumping = false;

        }


        // Score
        player.score +=
            deltaTime * 10;

    }

}


// ======================================================
// GET CLIENT GAME STATE
// ======================================================

function getGameState(lobbyId) {

    const game =
        games.get(lobbyId);


    if (!game) {
        return null;
    }


    return {

        gameId: game.id,

        lobbyId: game.lobbyId,

        tick: game.tick,

        gameTime: game.gameTime,

        speed: game.speed,

        players:
            Object.values(
                game.players
            ).map(player => ({

                id: player.id,

                username: player.username,

                x: player.x,

                y: player.y,

                isJumping:
                    player.isJumping,

                score:
                    Math.floor(
                        player.score
                    ),

                alive:
                    player.alive

            })),

        obstacles:
            game.obstacles

    };

}


// ======================================================
// END GAME
// ======================================================

function endGame(lobbyId) {

    const game =
        games.get(lobbyId);


    if (!game) {
        return null;
    }


    game.running = false;


    return game;

}


module.exports = {

    createGame,

    getGame,

    removeGame,

    handlePlayerInput,

    updateGame,

    getGameState,

    endGame

};