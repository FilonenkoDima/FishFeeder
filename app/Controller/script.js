//#region server function
const SERVER = "fishfeeder-69of.onrender.com";
const FeederID = "esp32-1";

// connect to WebSocket server
const deviceId = 'web'; // Set your device ID here
const socket = new WebSocket('wss://' + SERVER);

// Connection opened
socket.addEventListener('open', function (event) {
    console.log('Connected to WebSocket server');
    socket.send(`deviceId:${deviceId}`); // Send device ID to the server
});

// Listen for messages
socket.addEventListener('message', function (event) {
    console.log('Message from server11', event.data);
    const message = event.data;
   
    const parsedMessage = message.split(':'); // Assuming the format is "ID:value"
    
    // Check if the sender ID is 'esp32-1'
    if (parsedMessage[0] === FeederID) {
        // Update the UI with the new value
        setProgress(parseInt(parsedMessage[1], 10));
    }
});

// Connection closed
socket.addEventListener('close', function (event) {
    console.log('Disconnected from WebSocket server');
});

// Handle errors
socket.addEventListener('error', function (event) {
    console.error('WebSocket error observed:', event);
});

// Initialize the page when DOM content is loaded
document.addEventListener("DOMContentLoaded", initializePage);

function initializePage() {
  fetchConfig();
  $(document).ready(() => {
    showPlanerInfo();
    showFeedText();
  });
}

// Fetches configuration from the server
async function fetchConfig() {
  try {
    const response = await fetch('https://' + SERVER + '/config');
    if (!response.ok) { // Check if the response is successful
      throw new Error('Network response was not ok ' + response.statusText);
    }
    const data = await response.json();
    updateUI(data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function updateUI(data) {
  toggleWeightActive(data.quantity);
  displayTimers(data.interval);
  showFeedText(data.repeat);
  showPlanerInfo(data.interval, data.repeat);
  setProgress(data.procent);
}

// Updates configuration on the server
async function updateConfig() {
  const config = getConfig();

  try {
    const response = await fetch('https://' + SERVER + '/config', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });
    console.log(await response.text());
  } catch (error) {
    console.error("Error updating configuration:", error);
  }
}

function getConfig() {
  return {
    quantity: $(".activeQuantity").length
      ? parseInt($(".activeQuantity")[0].innerText, 10)
      : 0,
    procent: parseInt(
      document.getElementById("progressText").textContent.slice(0, -1),
      10
    ),
    feedNow: feed,
    repeat: getRepeatDay(),
    interval: getInterval(),
  };
}

//#endregion

//#region progressBar

// Progress bar handling

const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

function setProgress(heightPercentage) {
  progressBar.style.height = `${heightPercentage}%`;
  progressText.textContent = `${heightPercentage}%`;
  updateConfig();
}

//#endregion

//#region set active weight

// Toggle active weight
function toggleWeightActive(quantityValue) {
  $("#gram-container").children().removeClass("activeQuantity");
  $(`#weight${quantityValue}`).addClass("activeQuantity");
  updateConfig();
}

//#endregion

//#region feed now button

// Feed now button
function feedNow() {
  feed = 1;  // Set feed to indicate feeding now
  socket.send('feedNow:' + feed);  // Send "feedNow" message with value to the WebSocket server
  updateConfig();  // Update configuration as previously defined
}

//#endregion

//#region planner info

// Planner info handling
function getRepeatDay() {
  const text = document.getElementById("feedText").textContent;
  if (text === "Годувати кожен день") return 1;
  if (text === "Вкажіть інтервал годування") return 0;
  return parseInt(text.slice(15), 10);
}

function getIntervalDayText(interval) {
  if (interval === 1) return "Годувати кожен день";
  if (interval > 1 && interval < 31)
    return `Годувати кожен ${interval}-ий день`;
  return "Вкажіть інтервал годування";
}

function getInterval() {
  const timers = document.getElementsByClassName("btn__secondary2");
  const result = Array.from(timers).map((timer) =>
    parseInt(timer.textContent, 10)
  );
  return [...new Set(result)].sort((a, b) => a - b);
}

function showPlanerInfo(repeat, interval) {
  $("#text-plan").empty();
  let intervals = repeat
    ? repeat.map((el) => `${el < 10 ? "0" : ""}${el}:00`).join(", ")
    : "";
  $(".text-plan").append(
    `<p>${getIntervalDayText(interval)} о ${intervals}</p>`
  );
}

//#endregion

//#region toggle window

// Toggle window
function toggleDiv() {
  $(".components, .components2").toggle();
}

//#endregion

//#region change interval

// Change interval handling
function toggleModalDay() {
  $(".modal-container-day").toggle();
}

let newDayInterval;
function changeRangeDayValue(val) {
  const parsedVal = parseInt(val, 10) || 0;
  document.getElementById("rangeDay").value = parsedVal;
  newDayInterval = parsedVal;
}

function changeInputDayValue(val) {
  const parsedVal = parseInt(val, 10) || 0;
  document.getElementById("numberDay").value = parsedVal;
  newDayInterval = parsedVal;
}

function stepUpDay() {
  adjustDayValue(1);
}

function stepDownDay() {
  adjustDayValue(-1);
}

function adjustDayValue(step) {
  const input = document.getElementById("numberDay");
  let newValue = parseInt(input.value, 10) + step;
  if (newValue < 1) newValue = 30;
  if (newValue > 30) newValue = 1;
  input.value = newValue;
  changeRangeDayValue(newValue);
}

function changeRepeat() {
  newDayInterval = newDayInterval || 1;
  showPlanerInfo(getInterval(), newDayInterval);
  showFeedText(newDayInterval);
  toggleModalDay();
  updateConfig();
}

function showFeedText(interval) {
  $("#feedText")
    .empty()
    .append(`<p>${getIntervalDayText(interval)}</p>`);
}

//#endregion

//#region show timers

// Show timers handling
function showShort(id) {
  $(`#time_${id}, #short_${id}`).toggle();
}

function displayTimers(intervals) {
  $("#timer").empty();
  intervals.forEach((interval) => {
    $("#timer").append(getDivTimer(interval));
  });
}

function getDivTimer(interval) {
  return `
    <div class="btn2 btn__secondary2" onclick="showShort('${interval}')" id="${interval}">
      <div id="time_${interval}">${interval < 10 ? "0" : ""}${interval}:00</div>
      <div class="icon2" id="short_${interval}" onclick="removeTimer('${interval}')">
        <div class="icon__add">
          <ion-icon name="trash"></ion-icon>
        </div>
      </div>
    </div>`;
}

function toggleModalTime() {
  $(".modal-container-time").toggle();
}

function removeTimer(timer) {
  const timerAsNumber = parseInt(timer, 10);
  const timers = getInterval().filter((t) => t !== timerAsNumber);
  displayTimers(timers);
  showPlanerInfo(timers, newDayInterval || getRepeatDay());
  updateConfig();
}

//#endregion

//#region add new timer

// Add new timer handling
let newTimeInterval;

function changeRangeTimeValue(val) {
  const parsedVal = parseInt(val, 10) || 0;
  document.getElementById("rangeTime").value = parsedVal;
  newTimeInterval = parsedVal;
}

function changeInputTimeValue(val) {
  const parsedVal = parseInt(val, 10) || 0;
  document.getElementById("numberTime").value = parsedVal;
  newTimeInterval = parsedVal;
}

function stepUpTime() {
  adjustTimeValue(1);
}

function stepDownTime() {
  adjustTimeValue(-1);
}

function adjustTimeValue(step) {
  const input = document.getElementById("numberTime");
  let newValue = (parseInt(input.value, 10) + step) % 24;
  if (newValue < 0) newValue += 24;
  input.value = newValue;
  changeRangeTimeValue(newValue);
}

function addStore() {
  let timers = new Set(getInterval());
  newTimeInterval = newTimeInterval || 0;

  timers.add(parseInt(newTimeInterval, 10));
  timers = Array.from(timers);
  displayTimers(timers.sort((a, b) => a - b));
  toggleModalTime();
  showPlanerInfo(timers, newDayInterval || getRepeatDay());
  updateConfig();
}

//#endregion
