let currentUser = {};
let questions = [];
let currentIndex = 0;
let score = 0;
let timer;
let duration = 0;
let selectedAnswer = null;
let practiceMode = false;

const sounds = {
  click: new Audio("sounds/click.mp3"),
  correct: new Audio("sounds/correct.mp3"),
  wrong: new Audio("sounds/wrong.mp3"),
  timeout: new Audio("sounds/timeout.mp3")
};
let soundOn = true;

function playSound(name) {
  if (soundOn) {
    sounds[name].currentTime = 0;
    sounds[name].play();
  }
}

function toggleAudio() { soundOn = !soundOn; }

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function login() {
  const fullname = document.getElementById("fullname").value.trim();
  const classname = document.getElementById("class").value;
  const nickname = document.getElementById("nickname").value.trim();
  if (!fullname || !classname || !nickname) {
    alert("Vui lòng nhập đầy đủ thông tin");
    return;
  }
  currentUser = { fullname, classname, nickname };
  document.getElementById("profile").innerText = `${fullname} (${classname}) - ${nickname}`;
  showScreen("menu-screen");
}

function logout() {
  currentUser = {};
  showScreen("login-screen");
}

async function loadQuestions() {
  const res = await fetch("questions_mix13.json");
  return res.json();
}

async function startPractice() {
  practiceMode = true;
  score = 0; duration = 0;
  questions = await loadQuestions();
  questions = shuffle(questions).slice(0,10);
  currentIndex = 0;
  showQuestion();
  showScreen("quiz-screen");
}

async function startArena() {
  practiceMode = false;
  score = 0; duration = 0;
  questions = await loadQuestions();
  questions = shuffle(questions).slice(0,20);
  currentIndex = 0;
  showQuestion();
  showScreen("quiz-screen");
}

function showQuestion() {
  clearInterval(timer);
  selectedAnswer = null;
  let q = questions[currentIndex];
  document.getElementById("question-box").innerHTML = `<h3>${q.question}</h3>`;
  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";
  q.options.forEach(opt => {
    let btn = document.createElement("button");
    btn.innerText = opt;
    btn.onclick = () => { selectedAnswer = opt; playSound("click"); };
    answersDiv.appendChild(btn);
  });
  startTimer();
}

function startTimer() {
  let time = 59;
  const bar = document.getElementById("timer-bar");
  timer = setInterval(() => {
    duration++;
    time--;
    let width = (time/59)*100;
    bar.style.width = width + "%";
    bar.style.background = time<20 ? "red" : time<40 ? "orange" : "green";
    if (time <= 0) {
      clearInterval(timer);
      playSound("timeout");
      nextQuestion();
    }
  }, 1000);
}

function nextQuestion() {
  clearInterval(timer);
  if (selectedAnswer && selectedAnswer === questions[currentIndex].answer) {
    score++; playSound("correct");
  } else if (selectedAnswer) {
    playSound("wrong");
  }
  currentIndex++;
  if (currentIndex < questions.length) {
    showQuestion();
  } else {
    endQuiz();
  }
}

function endQuiz() {
  const total = questions.length;
  const points = ((score/total)*10).toFixed(2);
  document.getElementById("score-text").innerText = `Bạn đúng ${score}/${total} → ${points} điểm`;
  showScreen("result-screen");

  if (!practiceMode) {
    submitResult(points, total);
  }
}

async function submitResult(points, total) {
  const payload = {
    timestamp: new Date().toLocaleString(),
    name: currentUser.fullname,
    class: currentUser.classname,
    nickname: currentUser.nickname,
    score: points,
    total: total,
    duration: duration
  };
  await fetch("https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

async function showLeaderboard() {
  showScreen("leaderboard-screen");
  const res = await fetch("https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec");
  const data = await res.json();
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";
  data.slice(0,10).forEach((item, i) => {
    let li = document.createElement("li");
    li.innerText = `${i+1}. ${item.name} (${item.class}) - ${item.nickname}: ${item.score}`;
    if (i===0) li.classList.add("top1");
    if (i===1) li.classList.add("top2");
    if (i===2) li.classList.add("top3");
    list.appendChild(li);
  });
}

function showMenu() { showScreen("menu-screen"); }

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}
