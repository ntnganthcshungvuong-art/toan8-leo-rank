const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";

let currentUser = {};
let questions = [];
let currentQuestion = 0;
let score = 0;
let selectedAnswer = null;
let timerInterval;

// === Đăng nhập ===
function login() {
  const fullname = document.getElementById("fullname").value.trim();
  const classname = document.getElementById("class").value.trim();
  const nickname = document.getElementById("nickname").value.trim();

  if (!fullname || !classname || !nickname) {
    alert("Vui lòng nhập đủ Họ tên, Lớp và Biệt danh!");
    return;
  }
  currentUser = { fullname, classname, nickname };
  document.getElementById("user-nick").innerText = nickname;
  showScreen("menu-screen");
}

function logout() {
  currentUser = {};
  showScreen("login-screen");
}

// === Quản lý màn hình ===
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// === Quiz ===
async function loadQuestions() {
  const res = await fetch("questions_mix13.json");
  return await res.json();
}

async function startPractice() {
  questions = await loadQuestions();
  questions = shuffle(questions).slice(0, 10);
  startQuiz();
}

async function startArena() {
  questions = await loadQuestions();
  questions = shuffle(questions).slice(0, 20);
  startQuiz(true);
}

function startQuiz(arena = false) {
  currentQuestion = 0;
  score = 0;
  showScreen("quiz-screen");
  showQuestion();
  quizArena = arena;
}

function showQuestion() {
  clearInterval(timerInterval);
  selectedAnswer = null;
  const q = questions[currentQuestion];
  document.getElementById("question").innerHTML = q.question;
  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";
  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.onclick = () => {
      document.querySelectorAll("#answers button").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedAnswer = opt;
    };
    answersDiv.appendChild(btn);
  });
  startTimer();
}

function nextQuestion() {
  if (!selectedAnswer) {
    alert("Bạn chưa chọn đáp án!");
    return;
  }
  if (selectedAnswer === questions[currentQuestion].answer) score++;

  currentQuestion++;
  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    endQuiz();
  }
}

// === Timer ===
function startTimer() {
  let timeLeft = 59;
  const timerEl = document.getElementById("timer");
  timerEl.innerText = "⏱ " + timeLeft + "s";
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.innerText = "⏱ " + timeLeft + "s";
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      nextQuestion();
    }
  }, 1000);
}

// === Kết thúc quiz ===
function endQuiz() {
  clearInterval(timerInterval);
  showScreen("result-screen");
  const score10 = (score / questions.length * 10).toFixed(1);
  document.getElementById("score-text").innerText = `Bạn đúng ${score}/${questions.length} câu → Điểm: ${score10}`;

  if (quizArena) {
    // gửi API
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        timestamp: new Date().toLocaleString(),
        name: currentUser.fullname,
        class: currentUser.classname,
        nickname: currentUser.nickname,
        score: score10,
        duration: questions.length
      }),
    });
  }
}

// === BXH ===
function showLeaderboard() {
  showScreen("leaderboard-screen");
  fetch(API_URL + "?action=getRanking")
    .then(r => r.json())
    .then(data => {
      const table = document.getElementById("leaderboard");
      table.innerHTML = "<tr><th>Hạng</th><th>Tên</th><th>Lớp</th><th>Biệt danh</th><th>Điểm</th></tr>";
      data.forEach((row, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${i + 1}</td><td>${row.name}</td><td>${row.class}</td><td>${row.nickname}</td><td>${row.score}</td>`;
        table.appendChild(tr);
      });
    });
}

// === Utils ===
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
