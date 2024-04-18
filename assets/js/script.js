var count = 0;
var countWeight = 0;

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
});

function initCount() {
  var countRef = firebase.database().ref("/count");
  countRef.on(
    "value",
    function (snapshot) {
      count = +snapshot.val();
      console.log("count --- ", count);
    },
    function (error) {
      console.log("Error: " + error.code);
    }
  );

  var countWeightRef = firebase.database().ref("/countWeight");
  countWeightRef.on(
    "value",
    function (snapshot) {
      count = +snapshot.val();
      console.log("countWeight --- ", count);
    },
    function (error) {
      console.log("Error: " + error.code);
    }
  );
}

$(document).ready(function () {
  $("#timepicker").mdtimepicker(); //Initializes the time picker
  addDiv();
  addDivForWeight();

  initCount();

  $("#timepicker")
    .mdtimepicker()
    .on("timechanged", function (e) {
      let timeValue = e.time.toString();
      addStore(timeValue);
      count = count + 1;
      firebase
        .database()
        .ref()
        .update({
          count: parseInt(count),
        });
    });
});

function feednow() {
  firebase.database().ref().update({
    feednow: 1,
  });
}

function toggleDiv() {
  $(".components").toggle();
  $(".components2").toggle();
}

function addStore(timeValue) {
  console.log("count - ", count);

  firebase
    .database()
    .ref("timers/timer" + count)
    .set({
      time: timeValue || null,
    });
  addDiv();
}

function showShort(id) {
  $("#time_" + id).toggle();
  $("#short_" + id).toggle();
}

function removeDiv(id) {
  firebase
    .database()
    .ref("timers/timer" + id)
    .remove();

  setTimeout(5000);
  console.log(1);
  // $("#id").fadeOut(1, 0).fadeTo(500, 0);
  addDiv();
}

function addDiv() {
  let divRef = firebase.database().ref("timers");
  divRef.on("value", function (snapshot) {
    let obj = snapshot.val();
    if (obj) {
      let i = 0;
      let property = Object.entries(obj);
      let propertyValues = Object.entries(property);
      // console.log(propertyValues);
      $("#wrapper").html("");

      while (i < propertyValues.length) {
        let ts;
        if (
          propertyValues[i] &&
          propertyValues[i][1] &&
          propertyValues[i][1][1]
        ) {
          ts = propertyValues[i][1][1].time;
        } else ts = "";
        // console.log("ts - ", i, ts);
        let H = Number(ts.substr(0, 2));
        // console.log(H);
        let h = H % 12 || 12;
        h = h < 10 ? "0" + h : h; // leading 0 at the left for 1 digit hours
        let ampm = H < 12 ? " AM" : " PM";
        ts = h + ts.substr(2, 3) + ampm;
        // console.log(ts);
        let val;
        if (
          propertyValues[i] &&
          propertyValues[i][0] &&
          propertyValues[i][0] !== undefined &&
          propertyValues[i][0] !== null
        )
          val = propertyValues[i][1][0].slice(5);
        // console.log("val - ", val);
        const x = `
            <div id=${val}> 
                <div class="btn2 btn__secondary2" onclick=showShort(${val}) id="main_${val}">
                  <div id="time_${val}">
                    ${ts}
                  </div>
                  <div class="icon2" id="short_${val}" onclick=removeDiv(${val})>
                    <div class="icon__add">
                        <ion-icon name="trash"></ion-icon>
                    </div>
                  </div>
                </div>  
            </div>`;

        $("#wrapper").append(x);
        i++;
      }
    }
  });
}

function showShortWeight(key) {
  $("#data_" + key).toggle();
  $("#shortWeight_" + key).toggle();
}

function removeWeightDiv(key) {
  console.log("remove - " + key);
}

function addDivForWeight() {
  let weightRef = firebase.database().ref("weight");
  weightRef.on("value", function (snapshot) {
    let weights = snapshot.val();

    // Очистка контейнера перед добавлением новых элементов
    $("#gram-container").html("");

    // Перебор каждого веса
    for (let key in weights) {
      if (weights.hasOwnProperty(key)) {
        let weight = weights[key];
        let isActive = weight.active;
        let weightValue = weight.weight;
        // Создание кнопки для веса
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
              <div class="icon__toggleActive" onclick="toggleWeightDiv('${key}');">
                <ion-icon name="toggle"></ion-icon>
              </div>
              </div>
            </div>
          </div>
        </div>`;

        // Добавление кнопки в контейнер
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

function toggleWeightDiv(weightValue) {
  let weightRef = firebase.database().ref("weight");

  weightRef.once("value", function (snapshot) {
    let weights = snapshot.val();

    // Перебираем каждый вес
    for (let key in weights) {
      if (weights.hasOwnProperty(key)) {
        let weight = weights[key];

        // Если вес активен, меняем его значение на false
        if (weight.active) {
          firebase
            .database()
            .ref("weight/" + key)
            .update({ active: false });
        }

        // Если вес совпадает с выбранным, меняем его значение на true
        if (key === weightValue) {
          firebase
            .database()
            .ref("weight/" + key)
            .update({ active: true });
        }
      }
    }
  });

  addDivForWeight();
}

// modal window

function changeRangeValue(val) {
  document.getElementById("rangeWeight").value = isNaN(parseInt(val, 10))
    ? 0
    : parseInt(val, 10);
  showValue1(val);
}

function changeInputValue(val) {
  document.getElementById("numberWeight").value = isNaN(parseInt(val, 10))
    ? 0
    : parseInt(val, 10);
  showValue1(val);
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

function toggleModal() {
  $(".modal-container").toggle();
}
