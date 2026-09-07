const { Server } = require("socket.io");

const matchmakingSocket = require("../matchmaking/matchmaking.socket");
const gameSocket = require("../game/game.socket");


function initializeSocket(server) {

    const io = new Server(server, {

        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }

    });


    io.on("connection", (socket) => {

        console.log(
            `Player connected: ${socket.id}`
        );


        // Matchmaking events
        matchmakingSocket(io, socket);


        // Game events
        gameSocket(io, socket);


        // Disconnect
        socket.on("disconnect", (reason) => {

            console.log(
                `Player disconnected: ${socket.id}`
            );

            console.log(
                `Reason: ${reason}`
            );

        });

    });


    return io;
}


module.exports = initializeSocket;