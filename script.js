// ================== CẤU HÌNH ==================
const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";
let soundOn = true;

const sounds = {
  click: new Audio("click.mp3"),
  correct: new Audio("correct.mp3"),
  wrong: new Audio("wrong.mp3"),
  timeout: new Audio("timeout.mp3"),
  win: new Audio("win.mp3")
};
Object.values(sounds).forEach(s => s.load());

// ================== LOGIN ==================
document.getElementById("btn-start").addEventListener("click", login);

function login() {
  const name = document.getElementById("fullname").value.trim();
  const cls = document.getElementById("classname").value;
  const nickname = document.getElementById("nickname").value.trim();

  if (!name || !cls || !nickname) {
    alert("❌ Vui lòng nhập đủ Họ tên, chọn Lớp và Biệt danh!");
    return;
  }

  localStorage.setItem("player", JSON.stringify({ name, cls, nickname, score: 0 }));
  showMenu();
}

function showMenu() {
  document.getElementById("login-screen").classList.remove("active");
  document.getElementById("menu-screen").classList.add("active");

  const player = JSON.parse(localStorage.getItem("player"));
  document.getElementById("playerName").textContent = player.name;
  document.getElementById("playerNick").textContent = player.nickname;
}

// ================== AUDIO ==================
function playSound(type) {
  if (soundOn && sounds[type]) {
    sounds[type].currentTime = 0;
    sounds[type].play().catch(() => {});
  }
}

function toggleAudio() {
  soundOn = !soundOn;
  alert(soundOn ? "Âm thanh BẬT" : "Âm thanh TẮT");
  if (soundOn) playSound("click"); // test ngay 1 tiếng
}

document.getElementById("btn-audio-login").addEventListener("click", toggleAudio);
document.getElementById("btn-audio-top").addEventListener("click", toggleAudio);

// ================== QUIZ (demo) ==================
let currentQ = 0;
let score = 0;
let questions = [];

document.getElementById("btn-practice").addEventListener("click", () => startQuiz("practice"));
document.getElementById("btn-arena").addEventListener("click", () => startQuiz("arena"));

function startQuiz(mode) {
  document.getElementById("menu-screen").classList.remove("active");
  document.getElementById("quiz-screen").classList.add("active");

  // demo: lấy dữ liệu từ file json
  fetch("questions_chap1.json")
    .then(res => res.json())
    .then(data => {
      questions = shuffle(data).slice(0, mode === "arena" ? 20 : 10);
      currentQ = 0;
      score = 0;
      showQuestion();
    });
}

function showQuestion() {
  if (currentQ >= questions.length) {
    return finishQuiz();
  }
  const q = questions[currentQ];
  document.getElementById("progressText").textContent = `Câu ${currentQ + 1}/${questions.length}`;
  document.getElementById("questionBox").innerHTML = q.question;

  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";
  q.options.forEach(opt => {
    const div = document.createElement("div");
    div.className = "answer";
    div.textContent = opt;
    div.onclick = () => {
      document.querySelectorAll(".answer").forEach(a => a.classList.remove("selected"));
      div.classList.add("selected");
    };
    answersDiv.appendChild(div);
  });
}

document.getElementById("nextBtn").addEventListener("click", () => {
  const selected = document.querySelector(".answer.selected");
  if (!selected) {
    alert("❗ Hãy chọn 1 đáp án!");
    return;
  }
  const ans = selected.textContent;
  if (ans === questions[currentQ].answer) {
    score++;
    playSound("correct");
  } else {
    playSound("wrong");
  }
  currentQ++;
  showQuestion();
});

function finishQuiz() {
  document.getElementById("quiz-screen").classList.remove("active");
  document.getElementById("result-screen").classList.add("active");

  document.getElementById("resultText").textContent = `Bạn đạt ${score}/${questions.length} câu đúng.`;

  playSound("win");

  // gửi API nếu là đấu trường
  const player = JSON.parse(localStorage.getItem("player"));
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      name: player.name,
      class: player.cls,
      nickname: player.nickname,
      score: score,
      duration: questions.length
    })
  });
}

// ================== UTILS ==================
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
