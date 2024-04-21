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
});

function setActiveWeight() {
  firebase
    .database()
    .ref("weight/weight10/quantity")
    .once("value", function (snapshot) {
      let quantity = snapshot.val();
      $(`#weight${quantity}`).addClass("activeWeight");
    });
}

// годування зараз
function feednow() {
  firebase.database().ref().update({
    feednow: 1,
  });
}

// видалення таймера
function removeTimer(id) {
  const keyData = id.split("_");
  console.log(keyData[0], keyData[1]);

  firebase
    .database()
    .ref(`weight/${keyData[0]}/interval`)
    .once("value")
    .then((snapshot) => {
      let existingArray = snapshot.val() || [];
      if (existingArray.includes(parseInt(keyData[1]))) {
        console.log("existingArray - ", existingArray);
        const index = existingArray.indexOf(parseInt(keyData[1]));
        console.log("index - ", index);
        if (index > -1) {
          existingArray.splice(index, 1);
        }
        console.log("new existingArray - ", existingArray);
        firebase
          .database()
          .ref(`weight/${keyData[0]}`)
          .update({ interval: existingArray });
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
  let divRef = firebase.database().ref("weight");
  divRef.on("value", function (snapshot) {
    let obj = snapshot.val();
    if (obj) {
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          $(`#timer__${key}`).html("");
          let intervals = obj[key].interval;
          if (intervals)
            for (const interval of intervals) {
              $(`#timer__${key}`).append(getDivTimer(key, interval));
            }
          $(`#timer__${key}`).append(getAddTimerButton(`${key}`));
        }
      }
    }
  });
}

function getDivTimer(key, interval) {
  return `
                <div class="btn2 btn__secondary2" onclick=showShort("${key}_${interval}") id="${key}_${interval}">
                  <div id="time_${key}_${interval}">
                    ${interval}
                  </div>
                  <div class="icon2" id="short_${key}_${interval}" onclick=removeTimer('${key}_${interval}')>
                    <div class="icon__add">
                        <ion-icon name="trash"></ion-icon>
                    </div>
                  </div>
            </div>`;
}

function getAddTimerButton(key) {
  return `<div class="icon iconAddWeight" onclick="toggleModal('${key}')" id="btnAddTimer_${key}">
            <div class="icon__add">
              <ion-icon name="add"></ion-icon>
            </div>
          </div>`;
}

// логіка для текстової інформації від планера
function showPlanerInfo() {
  $("#text-plan").html("");
  let divRef = firebase.database().ref("weight");
  divRef.on("value", function (snapshot) {
    let obj = snapshot.val();
    if (obj) {
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          let intervals = obj[key].interval;
          if (intervals) {
            switch (key) {
              case "weight10":
                $(".text-plan").append(`<p>Годувати кожен день о
  ${intervals.join(", ")}</p>`);
                break;
              case "weight20":
                $(".text-plan").append(`<p>Годувати через день о
  ${intervals.join(", ")}</p>`);
                break;
              case "weight30":
                $(".text-plan").append(`<p>Годувати через 2 дні о
  ${intervals.join(", ")}</p>`);
                break;
            }
          }
        }
      }
    }
  });
}

let activeWeightKey;

function toggleModal(key) {
  $(".modal-container").toggle();
  if (key) activeWeightKey = key.toString();
}

// функції для керування модальним вікном

let newInterval;
function changeRangeValue(val) {
  document.getElementById("rangeWeight").value = isNaN(parseInt(val, 10))
    ? 0
    : parseInt(val, 10);
  newInterval = val;
}

function changeInputValue(val) {
  document.getElementById("numberWeight").value = isNaN(parseInt(val, 10))
    ? 0
    : parseInt(val, 10);
  newInterval = val;
}

function stepUp() {
  let input = document.getElementById("numberWeight");
  let newValue = parseInt(input.value, 10) + 1;
  if (newValue > 23) newValue = 0;
  input.value = newValue;
  changeRangeValue(newValue);
}

function stepDown() {
  let input = document.getElementById("numberWeight");
  let newValue = parseInt(input.value, 10) - 1;
  if (newValue < 0) newValue = 23;
  input.value = newValue;
  changeRangeValue(newValue);
}

function addStore() {
  firebase
    .database()
    .ref(`weight/${activeWeightKey}/interval`)
    .once("value")
    .then((snapshot) => {
      let existingArray = snapshot.val() || [];
      if (!newInterval) newInterval = 0;
      if (!existingArray.includes(parseInt(newInterval))) {
        existingArray.push(parseInt(newInterval));
        firebase
          .database()
          .ref(`weight/${activeWeightKey}`)
          .update({ interval: existingArray });
      }
    });
  displayTimers();
  toggleModal();
}

// // перемикання активної ваги
function toggleWeightActive(weightKey) {
  $("#gram-container").children().removeClass("activeWeight");
  $(`#weight${weightKey}`).addClass("activeWeight");

  let weightRef = firebase.database().ref("weight");

  weightRef.once("value", function (snapshot) {
    let weights = snapshot.val();

    for (let key in weights) {
      if (weights.hasOwnProperty(key)) {
        firebase
          .database()
          .ref("weight/" + key)
          .update({ quantity: parseInt(weightKey) });
      }
    }
  });
}
