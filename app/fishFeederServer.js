const cors = require('cors');
const express = require("express");
const fs = require("fs");
const http = require("http");
const WebSocket = require('ws');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
console.log('port ' + process.env.PORT);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const filePath = "./data.json"; // Path to the JSON file that stores your configuration

// Store connections by device ID
const connections = {};

// WebSocket connection handler
wss.on('connection', function connection(ws, req) {
    let deviceId = null;

    ws.on('message', function incoming(message) {
        const messageStr = message.toString();
        
        // Check if the message is a device ID assignment
        if (!deviceId && messageStr.startsWith('deviceId:')) {
            deviceId = messageStr.split(':')[1];
            if (deviceId === 'esp32-1' || deviceId === 'web') {
                connections[deviceId] = ws;
                ws.send(`${deviceId} connected`);
                console.log(`Device ${deviceId} connected`);
            } else {
                ws.send(`Invalid deviceId: ${deviceId}`);
                ws.close();
            }
            return;
        }

        // Process message if deviceId is known and valid
        if (deviceId === 'esp32-1' || deviceId === 'web') {
            console.log(`Received from ${deviceId}: ${messageStr}`);

            // Broadcast to all clients
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(`${deviceId}: ${messageStr}`);
                }
            });
        }
    });

    ws.on('close', () => {
        if (deviceId) {
            console.log(`Device ${deviceId} disconnected`);
            delete connections[deviceId]; // Remove the connection when the client disconnects
        }
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
