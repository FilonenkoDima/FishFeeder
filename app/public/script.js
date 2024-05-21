document.addEventListener("DOMContentLoaded", function () {
  fetchConfig();
});

function fetchConfig() {
  fetch("/config")
    .then((response) => response.json())
    .then((data) => {
      toggleWeightActive(data.quantity);
      displayTimers(data.interval);
      showFeedText(data.repeat);
      showPlanerInfo(data.interval, data.repeat);
      setProgress(data.procent);
    })
    .catch((error) => console.error("Error fetching data:", error));
}

function updateConfig() {
  const config = {
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

  console.log(config);

  fetch("/config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  })
    .then((response) => response.text())
    // .then(() => {
    //   alert("Configuration updated successfully");
    //   // fetchConfig(); // Re-fetch the configuration to ensure the page displays the updated values
    // })
    .catch((error) => console.error("Error updating configuration:", error));
}

function getRepeatDay() {
  let text = document.getElementById("feedText").textContent;
  if (text === "Годувати кожен день") return 1;
  if (text === "Вкажіть інтервал годування") return 0;
  return parseInt(text.slice(15), 10);
}

function getInterval() {
  let timers = document.getElementsByClassName("btn__secondary2");
  let result = new Set();
  if (timers) {
    for (let i = 0; i < timers.length; i++) {
      result.add(parseInt(timers[i].textContent, 10));
    }
  }
  result = Array.from(result).sort((a, b) => a - b);
  console.log("typeof result: ", typeof result);
  return result;
}

// завантаження основних елементів сторінки
$(document).ready(function () {
  showPlanerInfo();
  showFeedText();
});
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

function setProgress(heightPercentage) {
  progressBar.style.height = heightPercentage + "%";
  progressText.textContent = heightPercentage + "%";
  updateConfig();
}

// функції для перемикання інтерфейсу в таймері
function toggleDiv() {
  $(".components").toggle();
  $(".components2").toggle();
}

function showShort(id) {
  $("#time_" + id).toggle();
  $("#short_" + id).toggle();
}

// виведення таймерів на UI

function displayTimers(obj) {
  $(`#timer`).html("");
  if (obj)
    for (const interval of obj) {
      $(`#timer`).append(getDivTimer(interval));
    }
}

function getDivTimer(interval) {
  return `
    <div class="btn2 btn__secondary2" onclick=showShort("${interval}") id="${interval}">
      <div id="time_${interval}">
        ${interval < 10 ? "0" : ""}${interval}:00
      </div>
      <div class="icon2" id="short_${interval}" onclick=removeTimer('${interval}')>
        <div class="icon__add">
            <ion-icon name="trash"></ion-icon>
        </div>
      </div>
    </div>`;
}

let feed = 0;
function feednow() {
  feed = 1;
  updateConfig();
}

function toggleModalTime() {
  $(".modal-container-time").toggle();
}

// функції для керування модальним вікном

let newTimeInterval;

function changeRangeTimeValue(val) {
  document.getElementById("rangeTime").value = isNaN(parseInt(val, 10))
    ? 0
    : parseInt(val, 10);
  newTimeInterval = val;
}

function changeInputTimeValue(val) {
  document.getElementById("numberTime").value = isNaN(parseInt(val, 10))
    ? 0
    : parseInt(val, 10);
  newTimeInterval = val;
}

function stepUpTime() {
  let input = document.getElementById("numberTime");
  let newValue = parseInt(input.value, 10) + 1;
  if (newValue > 23) newValue = 0;
  input.value = newValue;
  changeRangeTimeValue(newValue);
}

function stepDownTime() {
  let input = document.getElementById("numberTime");
  let newValue = parseInt(input.value, 10) - 1;
  if (newValue < 0) newValue = 23;
  input.value = newValue;
  changeRangeTimeValue(newValue);
}

//#region

function toggleModalDay() {
  $(".modal-container-day").toggle();
}

let newDayInterval;
function changeRangeDayValue(val) {
  document.getElementById("rangeDay").value = isNaN(parseInt(val, 10))
    ? 0
    : parseInt(val, 10);
  newDayInterval = val;
}

function changeInputDayValue(val) {
  document.getElementById("numberDay").value = isNaN(parseInt(val, 10))
    ? 0
    : parseInt(val, 10);
  newDayInterval = val;
}

function stepUpDay() {
  let input = document.getElementById("numberDay");
  let newValue = parseInt(input.value, 10) + 1;
  if (newValue > 30) newValue = 1;
  input.value = newValue;
  changeRangeDayValue(newValue);
}

function stepDownDay() {
  let input = document.getElementById("numberDay");
  let newValue = parseInt(input.value, 10) - 1;
  if (newValue < 1) newValue = 30;
  input.value = newValue;
  changeRangeDayValue(newValue);
}

function changeRepeat() {
  if (!newDayInterval) newDayInterval = 1;

  showPlanerInfo(getInterval(), newDayInterval);
  showFeedText(newDayInterval);
  toggleModalDay();
  updateConfig();
}

//#endregion

function getIntervalDayText(interval) {
  switch (true) {
    case interval === 1:
      return `Годувати кожен день`;
    case interval > 2 && interval < 31:
      return `Годувати кожен ${interval}-ий день`;
    default:
      return "Вкажіть інтервал годування";
  }
}

// логіка для текстової інформації від планера
function showPlanerInfo(repeat, interval) {
  $("#text-plan").html("");
  let intervals = "";
  if (repeat) {
    repeat.forEach((element) => {
      intervals += `${element < 10 ? "0" : ""}${element}:00, `;
    });
  }
  $(".text-plan").append(`<p>${getIntervalDayText(interval)} о
        ${intervals.slice(0, -2)}</p>`);
}

function showFeedText(interval) {
  $("#feedText").html("");
  $("#feedText").append(`<p>${getIntervalDayText(interval)}`);
}

function addStore() {
  const timers = getInterval();
  if (!newTimeInterval) newTimeInterval = 0;

  timers.push(parseInt(newTimeInterval, 10));
  timers.sort((a, b) => a - b);
  displayTimers(timers);
  toggleModalTime();
  updateConfig();
}

function removeTimer(timer) {
  const timerAsNumber = parseInt(timer, 10);
  const timers = getInterval();
  if (timers.indexOf(timerAsNumber))
    timers.splice(timers.indexOf(timerAsNumber), 1);
  displayTimers(timers);
  updateConfig();
}

// перемикання активної ваги
function toggleWeightActive(quantityValue) {
  $("#gram-container").children().removeClass("activeQuantity");
  $(`#weight${quantityValue}`).addClass("activeQuantity");
  updateConfig();
}
