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
  procent: 10,
  quantity: 10,
  interval: ["14", "21", "11"],
  repeat: 1,
  feedNow: 0,
};

writeData(data);
readData();
