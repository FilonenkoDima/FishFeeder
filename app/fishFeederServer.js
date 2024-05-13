const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

const filePath = './data.json'; // Path to the JSON file that stores your configuration

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static('public'));

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
app.get('/config', (req, res) => {
    readData((err, data) => {
        if (err) {
            res.status(500).send('Error reading configuration data');
        } else {
            res.json(data);
        }
    });
});

// Endpoint to update the configuration
app.post('/config', (req, res) => {
    writeData(req.body, err => {
        if (err) {
            res.status(500).send('Failed to update configuration');
        } else {
            console.log('Updated Data:', req.body);
            res.send('Configuration updated successfully');
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
