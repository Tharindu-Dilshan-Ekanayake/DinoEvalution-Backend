require("dotenv").config();

const http = require("http");

const app = require("./app");
const initializeSocket = require("./config/socket");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

server.listen(PORT, () => {
    console.log("--------------------------------");
    console.log(" Dino Game Server");
    console.log("--------------------------------");
    console.log(`Server running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});