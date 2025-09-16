const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";

let currentUser = {};
let questions = [];
let currentIndex = 0;
let score = 0;
let timer;
let timeLeft = 59;

// Đăng nhập
function login() {
  const fullname = document.getElementById("fullname").value.trim();
  const classname = document.getElementById("class").value;
  const nickname = document.getElementById("nickname").value.trim();

  if (!fullname || !classname || !nickname) {
    alert("Điền đầy đủ Họ tên, Lớp, Biệt danh!");
    return;
  }
  currentUser = { fullname, classname, nickname };
  document.getElementById("profile-name").textContent = fullname;
  document.getElementById("profile-class").textContent = classname;
  document.getElementById("profile-nickname").textContent = nickname;
  showScreen("menu-screen");
}

function logout() {
  currentUser = {};
  showScreen("login-screen");
}

// Chuyển màn hình
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// Bắt đầu luyện tập
async function startPractice() {
  await loadQuestions();
  startQuiz(10, false);
}

// Bắt đầu đấu trường
async function startArena() {
  await loadQuestions();
  startQuiz(20, true);
}

// Load câu hỏi
async function loadQuestions() {
  const res = await fetch("questions_mix13.json");
  questions = await res.json();
  shuffle(questions);
}

function startQuiz(total, isArena) {
  currentIndex = 0;
  score = 0;
  modeArena = isArena;
  quizLength = total;
  showScreen("quiz-screen");
  showQuestion();
}

function showQuestion() {
  if (currentIndex >= quizLength) return endQuiz();

  const q = questions[currentIndex];
  const container = document.getElementById("question-container");
  container.innerHTML = `<h3>Câu ${currentIndex+1}: ${q.question}</h3>` +
    q.options.map((opt,i)=>`<div class="answer" onclick="selectAnswer('${opt}')">${opt}</div>`).join("");

  resetTimer();
}

let selectedAnswer = null;
function selectAnswer(ans) {
  selectedAnswer = ans;
  document.querySelectorAll(".answer").forEach(a => a.style.background="#fff");
  event.target.style.background = "#ffeb3b";
}

function resetTimer() {
  clearInterval(timer);
  timeLeft = 59;
  document.getElementById("timer-progress").style.width = "100%";
  timer = setInterval(()=>{
    timeLeft--;
    document.getElementById("timer-progress").style.width = (timeLeft/59*100)+"%";
    if (timeLeft <= 0) {
      clearInterval(timer);
      nextQuestion();
    }
  },1000);
}

function nextQuestion() {
  clearInterval(timer);
  if (selectedAnswer && selectedAnswer === questions[currentIndex].answer) {
    score++;
  }
  currentIndex++;
  selectedAnswer=null;
  if (currentIndex<quizLength) showQuestion();
  else endQuiz();
}

function endQuiz() {
  showScreen("result-screen");
  const finalScore = (score/quizLength*10).toFixed(1);
  document.getElementById("score-text").textContent = `Điểm: ${finalScore}/10`;

  if (modeArena) {
    const payload = {
      timestamp: new Date().toISOString(),
      name: currentUser.fullname,
      class: currentUser.classname,
      nickname: currentUser.nickname,
      score: finalScore,
      duration: quizLength*59
    };
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
}

async function showLeaderboard() {
  showScreen("leaderboard-screen");
  const res = await fetch(API_URL+"?action=getRanking");
  const data = await res.json();
  const table = document.getElementById("leaderboard-table");
  table.innerHTML = "<tr><th>Họ tên</th><th>Lớp</th><th>Nick</th><th>Điểm</th></tr>";
  data.forEach(r=>{
    table.innerHTML += `<tr><td>${r.name}</td><td>${r.class}</td><td>${r.nickname}</td><td>${r.score}</td></tr>`;
  });
}

// Shuffle mảng
function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
}
