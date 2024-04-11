function toggleDiv() {
  $(".components").toggle();
  $(".components2").toggle();
}

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

let countRef = firebase.database().ref("count");
countRef.on("value", function (snapshot) {
  count = snapshot.val();
  console.log(count);
});

function feednow() {
  firebase.database().ref().update({
    feednow: 1,
  });
}

$(document).ready(function () {
  $("#timepicker").mdtimepicker(); //Initializes the time picker
  addDiv();
});

$("#timepicker")
  .mdtimepicker()
  .on("timechanged", function (e) {
    console.log(e.time);
    addStore(count, e);
    count = count + 1;
    firebase
      .database()
      .ref()
      .update({
        count: parseInt(count),
      });
  });

function addStore(count, e) {
  firebase
    .database()
    .ref("timers/timer" + count)
    .set({
      time: e.time,
    });
  addDiv();
}

function showShort(id) {
  var idv = $(id)[0]["id"];
  $("#time_" + idv).toggle();
  $("#short_" + idv).toggle();
}

function removeDiv(id) {
  var idv = $(id)[0]["id"];
  firebase
    .database()
    .ref("timers/" + idv)
    .remove();
  if (count >= 0) {
    count = count - 1;
  }

  firebase
    .database()
    .ref()
    .update({
      count: parseInt(count),
    });
  $(id).fadeOut(1, 0).fadeTo(500, 0);
}

function addDiv() {
  var divRef = firebase.database().ref("timers");
  divRef.on("value", function (snapshot) {
    var obj = snapshot.val();
    var i = 0;
    $("#wrapper").html("");
    while (i <= count) {
      var propertyValues = Object.entries(obj);
      let ts = propertyValues[i][1]["time"];
      //var timeString = "12:04";
      var H = +ts.substr(0, 2);
      var h = H % 12 || 12;
      h = h < 10 ? "0" + h : h; // leading 0 at the left for 1 digit hours
      var ampm = H < 12 ? " AM" : " PM";
      ts = h + ts.substr(2, 3) + ampm;
      console.log(ts);

      const x = `
            <div id=${propertyValues[i][0]}>
                <div class="btn2 btn__secondary2" onclick=showShort(${propertyValues[i][0]}) id="main_${propertyValues[i][0]}">
                <div id="time_${propertyValues[i][0]}">
                ${ts}
                </div>
                <div class="icon2" id="short_${propertyValues[i][0]}" onclick=removeDiv(${propertyValues[i][0]})>
                    <div class="icon__add">
                        <ion-icon name="trash"></ion-icon>
                    </div>
                </div>
                </div>
                
                
            </div>`;

      $("#wrapper").append(x);
      i++;
    }
  });
}
