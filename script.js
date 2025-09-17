// ========== CẤU HÌNH ==========
const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";
const QUESTION_FILE = "questions_chap1.json"; // bạn có thể đổi sang chap3 hoặc mix13

// ========== BIẾN TOÀN CỤC ==========
let currentUser = null;
let questions = [];
let currentIndex = 0;
let score = 0;
let timer;
let soundOn = true;

// Âm thanh
const sounds = {
  click: new Audio("click.mp3"),
  correct: new Audio("correct.mp3"),
  wrong: new Audio("wrong.mp3"),
  timeout: new Audio("timeout.mp3"),
  win: new Audio("win.mp3")
};

// ========== HÀM HỖ TRỢ ==========
function playSound(type) {
  if (soundOn && sounds[type]) {
    sounds[type].currentTime = 0;
    sounds[type].play();
  }
}

function toggleAudio() {
  soundOn = !soundOn;
  alert(soundOn ? "Âm thanh: BẬT" : "Âm thanh: TẮT");
}

function saveUser(user) {
  localStorage.setItem("player", JSON.stringify(user));
}

function loadUser() {
  const data = localStorage.getItem("player");
  if (data) {
    currentUser = JSON.parse(data);
  }
}

function updateProfileUI() {
  if (!currentUser) return;
  document.getElementById("user-info").innerText =
    `${currentUser.name} (${currentUser.class}) - ${currentUser.nickname}`;
  document.getElementById("avatar").src = currentUser.avatar || "basic.png";
}

// ========== ĐĂNG NHẬP / ĐĂNG XUẤT ==========
function login() {
  const name = document.getElementById("name").value.trim();
  const cls = document.getElementById("class").value;
  const nickname = document.getElementById("nickname").value.trim();

  if (!name || !cls || !nickname) {
    alert("Vui lòng nhập đủ thông tin!");
    return;
  }

  currentUser = {
    name,
    class: cls,
    nickname,
    avatar: "basic.png",
    points: 0
  };
  saveUser(currentUser);
  updateProfileUI();

  document.getElementById("login").style.display = "none";
  document.getElementById("menu").style.display = "block";
}

function logout() {
  localStorage.removeItem("player");
  currentUser = null;
  location.reload();
}

// ========== QUIZ ==========
function startPractice() {
  startQuiz("practice");
}

function startArena() {
  startQuiz("arena");
}

async function startQuiz(mode) {
  playSound("click");

  const res = await fetch(QUESTION_FILE);
  const data = await res.json();
  questions = shuffle(data);

  questions = mode === "practice" ? questions.slice(0, 10) : questions.slice(0, 20);

  currentIndex = 0;
  score = 0;
  document.getElementById("menu").style.display = "none";
  document.getElementById("quiz").style.display = "block";
  showQuestion();
}

function showQuestion() {
  if (currentIndex >= questions.length) {
    return endQuiz();
  }

  const q = questions[currentIndex];
  document.getElementById("quiz-container").innerHTML = `
    <div class="question-card">
      <h3>Câu ${currentIndex + 1}: ${q.question}</h3>
      ${q.options.map((opt, i) => `
        <button class="option" onclick="selectOption(${i}, this)">${opt}</button>
      `).join("")}
    </div>
    <button id="nextBtn">Câu tiếp</button>
    <div id="timer-bar"></div>
  `;

  document.getElementById("nextBtn").addEventListener("click", nextQuestion);

  startTimer();
}

let selectedAnswer = null;
function selectOption(index, el) {
  playSound("click");
  selectedAnswer = index;

  document.querySelectorAll(".option").forEach(btn => {
    btn.classList.remove("selected");
  });
  el.classList.add("selected");
}

function startTimer() {
  let time = 59;
  const bar = document.getElementById("timer-bar");
  clearInterval(timer);
  timer = setInterval(() => {
    time--;
    bar.style.width = (time / 59 * 100) + "%";
    if (time <= 0) {
      clearInterval(timer);
      playSound("timeout");
      nextQuestion();
    }
  }, 1000);
}

function nextQuestion() {
  clearInterval(timer);

  if (selectedAnswer !== null) {
    const q = questions[currentIndex];
    if (q.options[selectedAnswer] === q.answer) {
      score++;
      playSound("correct");
    } else {
      playSound("wrong");
    }
  }
  selectedAnswer = null;
  currentIndex++;
  showQuestion();
}

function endQuiz() {
  document.getElementById("quiz").style.display = "none";
  document.getElementById("result").style.display = "block";

  const total = questions.length;
  const point = (score / total * 10).toFixed(1);

  document.getElementById("result-text").innerText =
    `Kết quả: ${score}/${total} → ${point} điểm`;

  playSound("win");

  // Nếu là đấu trường thì gửi API
  if (questions.length === 20 && currentUser) {
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        name: currentUser.name,
        class: currentUser.class,
        nickname: currentUser.nickname,
        score: point,
        duration: new Date().toLocaleTimeString()
      }),
      headers: { "Content-Type": "application/json" }
    });
  }
}

// ========== BẢNG XẾP HẠNG ==========
async function showLeaderboard() {
  playSound("click");
  document.getElementById("menu").style.display = "none";
  document.getElementById("leaderboard").style.display = "block";

  const res = await fetch(API_URL + "?action=getRanking");
  const data = await res.json();

  let html = "<h3>Top 10 Đấu Trường</h3><ol>";
  data.forEach((p, i) => {
    let medal = "";
    if (i === 0) medal = "🥇 ";
    else if (i === 1) medal = "🥈 ";
    else if (i === 2) medal = "🥉 ";
    html += `<li>${medal}${p.nickname} (${p.class}) - ${p.score} điểm</li>`;
  });
  html += "</ol>";
  document.getElementById("leaderboard").innerHTML = html + `<button id="btn-lb-back">Quay về menu</button>`;
  document.getElementById("btn-lb-back").addEventListener("click", showMenu);
}

// ========== CHUNG ==========
function showMenu() {
  document.getElementById("quiz").style.display = "none";
  document.getElementById("result").style.display = "none";
  document.getElementById("leaderboard").style.display = "none";
  document.getElementById("menu").style.display = "block";
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// ========== KẾT NỐI NÚT ==========
window.addEventListener("DOMContentLoaded", () => {
  loadUser();
  if (currentUser) {
    document.getElementById("login").style.display = "none";
    document.getElementById("menu").style.display = "block";
    updateProfileUI();
  }

  document.getElementById("btn-start")?.addEventListener("click", login);
  document.getElementById("btn-logout")?.addEventListener("click", logout);
  document.getElementById("btn-audio-login")?.addEventListener("click", toggleAudio);
  document.getElementById("btn-audio-top")?.addEventListener("click", toggleAudio);
  document.getElementById("btn-practice")?.addEventListener("click", startPractice);
  document.getElementById("btn-arena")?.addEventListener("click", startArena);
  document.getElementById("btn-leaderboard")?.addEventListener("click", showLeaderboard);
  document.getElementById("btn-home")?.addEventListener("click", showMenu);
  document.getElementById("btn-back-menu")?.addEventListener("click", showMenu);
});
