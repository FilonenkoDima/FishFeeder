const express = require("express");
const fs = require("fs");
const http = require("http");
const WebSocket = require('ws');
const app = express();
const PORT = 3000;

// Create an HTTP server from express app
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const filePath = "./data.json"; // Path to the JSON file that stores your configuration

// WebSocket connection handler
wss.on('connection', function connection(ws) {
    console.log("A new client Connected!");
    ws.send('Welcome New Client!');

    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        // You can broadcast to all clients or handle messages here
    });
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static("public"));

// Function to read data from file
function readData(callback) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            callback(err, null);
        } else {
            const config = JSON.parse(data);
            callback(null, config);
        }
    });
}

// Function to write data to file
function writeData(data, callback) {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFile(filePath, jsonData, (err) => {
        callback(err);
    });
}

// Endpoint to get the current configuration
app.get("/config", (req, res) => {
    readData((err, data) => {
        if (err) {
            res.status(500).send("Error reading configuration data");
        } else {
            res.json(data);
        }
    });
});

// Endpoint to update the configuration
app.post("/config", (req, res) => {
    writeData(req.body, (err) => {
        if (err) {
            res.status(500).send("Failed to update configuration");
        } else {
            console.log("Updated Data:", req.body);
            res.send("Configuration updated successfully");
        }
    });
});

// Start the HTTP and WebSocket server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
