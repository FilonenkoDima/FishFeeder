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

  $("#timepicker").mdtimepicker();
  displayTimer();
  displayWeight();
});

// отримання змінної count
let count;
let countRef = firebase.database().ref("/count");
countRef.on(
  "value",
  function (snapshot) {
    count = snapshot.val();
    console.log("count --- ", count);
  },
  function (error) {
    console.log("Error: " + error.code);
  }
);

// додавання нового таймера
function addTimerToFB(timeValue) {
  console.log(timeValue);
  firebase
    .database()
    .ref("timers/timer" + count)
    .set({
      time: timeValue || null,
    });
}

function addStore() {
  $("#timepicker")
    .mdtimepicker()
    .on("timechanged", function (e) {
      let timeValue = e.time.toString();
      addTimerToFB(timeValue);
    });

  count = count + 1;
  firebase
    .database()
    .ref()
    .update({
      count: parseInt(count),
    });
  displayTimer();
}

// годування зараз
function feednow() {
  firebase.database().ref().update({
    feednow: 1,
  });
}

// видалення таймера
function removeTimer(id) {
  firebase
    .database()
    .ref("timers/timer" + id)
    .remove();

  displayTimer();
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
function displayTimer() {
  let divRef = firebase.database().ref("timers");
  divRef.on("value", function (snapshot) {
    let obj = snapshot.val();
    if (obj) {
      $("#wrapper").html("");

      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          let timer = obj[key];
          let ts = timer.time;
          showPlanerInfo(ts);
          let H = Number(ts.substr(0, 2));
          let h = H % 12 || 12;
          h = h < 10 ? "0" + h : h;
          let ampm = H < 12 ? " AM" : " PM";
          ts = h + ts.substr(2, 3) + ampm;
          let val = key.slice(5);
          const x = `
            <div id=${val}> 
                <div class="btn2 btn__secondary2" onclick=showShort(${val}) id="main_${val}">
                  <div id="time_${val}">
                    ${ts}
                  </div>
                  <div class="icon2" id="short_${val}" onclick=removeTimer(${val})>
                    <div class="icon__add">
                        <ion-icon name="trash"></ion-icon>
                    </div>
                  </div>
                </div>  
            </div>`;

          $("#wrapper").append(x);
        }
      }
    } else $(".text-plan").append(`Заплануйте годування риб`);
  });
}

// логіка для текстової інформації від планера
function showPlanerInfo(time) {
  let textInfo = `<p>Годувати кожен <span class="">2-ий день</span> о 
  ${time.slice(0, 5)}</p>`;
  $(".text-plan").append(textInfo);
}

// функції для перемикання інтерфейсу в задані ваги
function showShortWeight(key) {
  $("#data_" + key).toggle();
  $("#shortWeight_" + key).toggle();
}

function toggleModal() {
  $(".modal-container").toggle();
}

// функції для керування модальним вікном

function changeRangeValue(val) {
  document.getElementById("rangeWeight").value = isNaN(parseInt(val, 10))
    ? 0
    : parseInt(val, 10);
  newWeight = val;
}

function changeInputValue(val) {
  document.getElementById("numberWeight").value = isNaN(parseInt(val, 10))
    ? 0
    : parseInt(val, 10);
  newWeight = val;
}

function stepUp() {
  var input = document.getElementById("numberWeight");
  var newValue = parseInt(input.value, 10) + 1;
  input.value = newValue;
  changeRangeValue(newValue);
}

function stepDown() {
  var input = document.getElementById("numberWeight");
  var newValue = parseInt(input.value, 10) - 1;
  input.value = newValue;
  changeRangeValue(newValue);
}

// виведення вагів на UI
function displayWeight() {
  let weightRef = firebase.database().ref("weight");
  weightRef.on("value", function (snapshot) {
    let weights = snapshot.val();

    $("#gram-container").html("");

    for (let key in weights) {
      if (weights.hasOwnProperty(key)) {
        let weight = weights[key];
        let isActive = weight.active;
        let weightValue = weight.weight;
        let buttonClass = isActive ? "activeWeight" : "";
        let button = `
        <div id=${key}>
          <div class="btn btn__gram ${buttonClass}" onclick="showShortWeight('${key}')">
            <p id="data_${key}">${weightValue} грам</p>
            <div class="icon2" id="shortWeight_${key}">
            <div class="weightButtonItem">
              <div class="icon__add" onclick=removeWeightDiv('${key}')>
                <ion-icon name="trash"></ion-icon>
              </div>
              <div class="icon__toggleActive" onclick="toggleWeightActive('${key}');">
                <ion-icon name="toggle"></ion-icon>
              </div>
              </div>
            </div>
          </div>
        </div>`;

        $("#gram-container").append(button);
      }
    }
    let buttonAdd = `                
                <div class="icon" onclick="toggleModal()">
                  <div class="icon__add">
                    <ion-icon name="add"></ion-icon>
                  </div>
                </div>`;
    $("#gram-container").append(buttonAdd);
  });
}

// видалення вагів
function removeWeightDiv(id) {
  firebase
    .database()
    .ref("weight/" + id)
    .remove();

  displayWeight();
}

// перемикання активної ваги
function toggleWeightActive(weightKey) {
  let weightRef = firebase.database().ref("weight");

  weightRef.once("value", function (snapshot) {
    let weights = snapshot.val();

    for (let key in weights) {
      if (weights.hasOwnProperty(key)) {
        let weight = weights[key];

        if (weight.active) {
          firebase
            .database()
            .ref("weight/" + key)
            .update({ active: false });
        }

        if (key === weightKey) {
          firebase
            .database()
            .ref("weight/" + key)
            .update({ active: true });
        }
      }
    }
  });

  displayWeight();
}

// оперування з вагою
let newWeight;
let countWeight;
let countWeightRef = firebase
  .database()
  .ref("/countWeight")
  .on(
    "value",
    function (snapshot) {
      countWeight = snapshot.val();
      console.log("countWeight:", countWeight);
    },
    function (error) {
      console.error("Ошибка получения значения:", error);
    }
  );

function addWeightToFB(newWeight) {
  firebase
    .database()
    .ref("weight/weight" + countWeight)
    .set({
      active: false,
      weight: parseInt(newWeight) || null,
    });
}

// додавання нової ваги
function addWeight() {
  if (!newWeight) newWeight = 1;
  addWeightToFB(newWeight);
  displayWeight();
  toggleWeightActive(`weight${countWeight}`);
  countWeight = countWeight + 1;
  firebase
    .database()
    .ref()
    .update({
      countWeight: parseInt(countWeight),
    });
  toggleModal();
}
