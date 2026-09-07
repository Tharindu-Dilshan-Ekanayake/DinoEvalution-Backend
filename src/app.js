const express = require("express");
const cors = require("cors");

const app = express();


// CORS
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true
    })
);


// JSON body parser
app.use(express.json());


// Test route
app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "Dino Game Server is running"
    });

});


// Health check
app.get("/health", (req, res) => {

    res.json({
        status: "ok"
    });

});


module.exports = app;