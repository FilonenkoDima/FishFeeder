// інінціалізація зв'язку з базою даних
const firebaseConfig = {
  apiKey: "AIzaSyA8JH9Ny5klquIcJCZjThBk_SmVyR6GIuQ",
  authDomain: "project-6062561231706985828.firebaseapp.com",
  databaseURL:
    "https://project-6062561231706985828-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "project-6062561231706985828",
  storageBucket: "project-6062561231706985828.appspot.com",
  messagingSenderId: "885933043696",
  appId: "1:885933043696:web:b955e65720911d0af7b735",
  measurementId: "G-SJV5ZVDNQC",
};
firebase.initializeApp(firebaseConfig);

// завантаження основних елементів сторінки
$(document).ready(function () {
  let procent;
  let procentRef = firebase.database().ref("procent");

  procentRef.on("value", function (snapshot) {
    procent = snapshot.val();
    if (procent !== null && !isNaN(procent)) {
      setProgress(Number(procent));
    }
  });

  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  function setProgress(heightPercentage) {
    progressBar.style.height = heightPercentage + "%";
    progressText.textContent = heightPercentage + "%";
  }

  displayTimers();
  setActiveWeight();
  showPlanerInfo();
  showFeedText();
});

function setActiveWeight() {
  firebase
    .database()
    .ref("quantity")
    .once("value", function (snapshot) {
      let quantity = snapshot.val();
      $(`#weight${quantity}`).addClass("activeQuantity");
    });
}

// годування зараз
function feednow() {
  firebase.database().ref().update({
    feednow: 1,
  });
}

// видалення таймера
function removeTimer(value) {
  firebase
    .database()
    .ref(`interval`)
    .once("value")
    .then((snapshot) => {
      let existingArray = snapshot.val() || [];
      if (existingArray.includes(parseInt(value))) {
        const index = existingArray.indexOf(parseInt(value));
        if (index > -1) {
          existingArray.splice(index, 1);
        }
        firebase.database().ref().update({ interval: existingArray });
      }
    });
  displayTimers();
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

function displayTimers() {
  let divRef = firebase.database().ref("interval");
  divRef.on("value", function (snapshot) {
    let obj = snapshot.val();
    if (obj) {
      $(`#timer`).html("");
      if (obj)
        for (const interval of obj) {
          $(`#timer`).append(getDivTimer(interval));
        }
    }
  });
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
  firebase
    .database()
    .ref()
    .update({ repeat: parseInt(newDayInterval) });

  showPlanerInfo();
  showFeedText();
  toggleModalDay();
}

//#endregion

function getIntervalDayText(callback) {
  firebase
    .database()
    .ref("repeat")
    .once("value", (snapshot) => {
      let obj = snapshot.val();
      let interval = parseInt(obj);
      let result;
      switch (true) {
        case interval === 1:
          result = `Годувати кожен день`;
          break;
        case interval === 2:
          result = `Годувати через 1 день`;
          break;
        case interval > 2 && interval < 5:
          result = `Годувати через ${interval} дні`;
          break;
        case interval > 4 && interval < 31:
          result = `Годувати через ${interval} днів`;
          break;
        default:
          result = "Вкажіть інтервал годування";
      }
      callback(result);
    });
}

// логіка для текстової інформації від планера
function showPlanerInfo() {
  $("#text-plan").html("");
  let divRef = firebase.database().ref("interval");
  divRef.on("value", function (snapshot) {
    let obj = snapshot.val();
    if (obj) {
      let intervals = "";
      for (const interval of obj) {
        intervals += `${interval < 10 ? "0" : ""}${interval}:00, `;
      }
      getIntervalDayText((result) => {
        $(".text-plan").append(`<p>${result} о
        ${intervals.slice(0, -2)}</p>`);
      });
    }
  });
}

function showFeedText() {
  $("#feedText").html("");
  getIntervalDayText((result) => {
    $("#feedText").append(`<p>${result}`);
  });
}

function addStore() {
  firebase
    .database()
    .ref(`interval`)
    .once("value")
    .then((snapshot) => {
      let existingArray = snapshot.val() || [];
      if (!newTimeInterval) newTimeInterval = 0;
      if (!existingArray.includes(parseInt(newTimeInterval))) {
        existingArray.push(parseInt(newTimeInterval));
        existingArray.sort((a, b) => a - b);
        firebase.database().ref().update({ interval: existingArray });
      }
    });
  displayTimers();
  toggleModalTime();
}

// // перемикання активної ваги
function toggleWeightActive(quantityValue) {
  $("#gram-container").children().removeClass("activeQuantity");
  $(`#weight${quantityValue}`).addClass("activeQuantity");

  let quantityRef = firebase.database().ref("quantity");

  quantityRef.once("value", function (snapshot) {
    firebase
      .database()
      .ref()
      .update({ quantity: parseInt(quantityValue) });
  });
}
