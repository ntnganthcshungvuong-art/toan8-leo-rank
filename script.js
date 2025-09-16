let currentUser = null;
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let timer;
let timeLeft = 59;
let mode = "practice"; // or arena
const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";

// Âm thanh
const clickSound = new Audio("sounds/click.mp3");
const correctSound = new Audio("sounds/correct.mp3");
const wrongSound = new Audio("sounds/wrong.mp3");
const timeoutSound = new Audio("sounds/timeout.mp3");
let soundOn = true;

document.getElementById("sound-toggle").onclick = () => {
  soundOn = !soundOn;
  document.getElementById("sound-toggle").innerText = soundOn ? "🔊" : "🔇";
};

function playSound(sound) {
  if (soundOn) sound.play();
}

function login() {
  const fullname = document.getElementById("fullname").value.trim();
  const classname = document.getElementById("classname").value.trim();
  const nickname = document.getElementById("nickname").value.trim();
  if (!fullname || !classname || !nickname) return alert("Nhập đủ thông tin!");

  currentUser = { fullname, classname, nickname };
  document.getElementById("user-nickname").innerText = nickname;
  showScreen("menu-screen");
}

function logout() {
  currentUser = null;
  showScreen("login-screen");
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

async function loadQuestions() {
  const res = await fetch("questions_mix13.json");
  return res.json();
}

async function startPractice() {
  mode = "practice";
  currentQuestions = shuffle((await loadQuestions())).slice(0, 10);
  startQuiz();
}

async function startArena() {
  mode = "arena";
  currentQuestions = shuffle((await loadQuestions())).slice(0, 20);
  startQuiz();
}

function startQuiz() {
  currentIndex = 0;
  score = 0;
  showScreen("quiz-screen");
  showQuestion();
}

function showQuestion() {
  clearInterval(timer);
  timeLeft = 59;
  const q = currentQuestions[currentIndex];
  document.getElementById("question-container").innerHTML = `
    <h3>${q.question}</h3>
    ${q.options.map(o => `<div class="answer" onclick="selectAnswer(this, '${o}')">${o}</div>`).join("")}
  `;
  updateTimer();
  timer = setInterval(updateTimer, 1000);
}

function updateTimer() {
  const bar = document.getElementById("timer-bar");
  bar.style.width = (timeLeft/59*100) + "%";
  bar.style.background = timeLeft < 15 ? "red" : timeLeft < 30 ? "orange" : "green";
  if (timeLeft <= 0) {
    clearInterval(timer);
    playSound(timeoutSound);
    nextQuestion();
  }
  timeLeft--;
}

function selectAnswer(el, ans) {
  document.querySelectorAll(".answer").forEach(a => a.classList.remove("selected"));
  el.classList.add("selected");
  const correct = currentQuestions[currentIndex].answer;
  if (ans === correct) {
    score++;
    playSound(correctSound);
  } else {
    playSound(wrongSound);
  }
  setTimeout(nextQuestion, 500);
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex >= currentQuestions.length) endQuiz();
  else showQuestion();
}

function endQuiz() {
  showScreen("result-screen");
  let finalScore = mode === "arena" ? (score/20*10).toFixed(1) : score;
  document.getElementById("result-text").innerText = `Điểm: ${finalScore}`;
  if (mode === "arena") {
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        fullname: currentUser.fullname,
        classname: currentUser.classname,
        nickname: currentUser.nickname,
        score: finalScore
      })
    });
  }
}

async function showLeaderboard() {
  showScreen("leaderboard-screen");
  const res = await fetch(API_URL + "?action=read");
  const data = await res.json();
  let rows = "<tr><th>Hạng</th><th>Tên</th><th>Lớp</th><th>Điểm</th></tr>";
  data.slice(0,10).forEach((p,i)=>{
    rows += `<tr><td>${i+1}</td><td>${p.nickname}</td><td>${p.classname}</td><td>${p.score}</td></tr>`;
  });
  document.getElementById("leaderboard").innerHTML = rows;
}

function shuffle(a) {
  return a.sort(()=>Math.random()-0.5);
}
