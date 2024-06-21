const fs = require("fs");
const filePath = "./data.json";

// Function to read data
function readData() {
  fs.readFile(filePath, (err, data) => {
    if (err) throw err;
    const config = JSON.parse(data);
    console.log(config);
  });
}

// Function to write data
function writeData(data) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFile(filePath, jsonData, (err) => {
    if (err) throw err;
    console.log("Data written to file");
  });
}

const data = {
  quantity: 30,
  procent: 80,
  feedNow: 0,
  repeat: 1,
  interval: [7, 23],
};

writeData(data);
readData();
