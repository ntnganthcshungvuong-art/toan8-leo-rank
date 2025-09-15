const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";

let user = {};
let questions = [];
let currentQuestion = 0, score = 0, mode = "practice", timer, timeLeft;
let soundOn = true;

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function login() {
  const name = document.getElementById("name").value.trim();
  const cls = document.getElementById("class").value;
  const nickname = document.getElementById("nickname").value.trim();
  if (!name || !cls || !nickname) return alert("Điền đủ thông tin!");

  user = { name, class: cls, nickname };
  localStorage.setItem("user", JSON.stringify(user));
  showScreen("menu-screen");
}

function logout() {
  localStorage.removeItem("user");
  location.reload();
}

window.onload = () => {
  const saved = localStorage.getItem("user");
  if (saved) { user = JSON.parse(saved); showScreen("menu-screen"); }
};

async function startQuiz(m) {
  mode = m;
  const res = await fetch("questions.json");
  questions = await res.json();
  questions = shuffle(questions).slice(0,10);
  currentQuestion = 0; score = 0;
  showQuestion();
  showScreen("quiz-screen");
}

function showQuestion() {
  const q = questions[currentQuestion];
  const container = document.getElementById("question-container");
  container.innerHTML = `
    <div class="question-card">
      <h3><b>Câu ${currentQuestion+1}:</b> ${q.question}</h3>
      ${q.options.map(o => `<div class="answer-card" onclick="selectAnswer(this, '${o}')">${o}</div>`).join("")}
    </div>`;
  startTimer(59);
}

function selectAnswer(el, choice) {
  document.querySelectorAll(".answer-card").forEach(a => a.classList.remove("selected"));
  el.classList.add("selected");
  el.dataset.choice = choice;
}

function nextQuestion() {
  const selected = document.querySelector(".answer-card.selected");
  if (selected) {
    const choice = selected.dataset.choice;
    if (choice === questions[currentQuestion].answer) {
      score++; if (soundOn) correctSound.play();
    } else if (soundOn) wrongSound.play();
  } else if (soundOn) timeoutSound.play();

  clearInterval(timer);
  currentQuestion++;
  if (currentQuestion < questions.length) showQuestion();
  else endQuiz();
}

function startTimer(sec) {
  timeLeft = sec;
  const bar = document.getElementById("timer-progress");
  timer = setInterval(() => {
    timeLeft--;
    let percent = (timeLeft/sec)*100;
    bar.style.width = percent+"%";
    bar.style.background = timeLeft<20 ? "red" : timeLeft<40 ? "orange" : "green";
    if (timeLeft<=0) { clearInterval(timer); nextQuestion(); }
  },1000);
}

function endQuiz() {
  showScreen("result-screen");
  document.getElementById("result-text").innerText = `Bạn đúng ${score}/${questions.length} câu.`;
  if (mode==="arena") {
    fetch(API_URL, {
      method:"POST",
      body: JSON.stringify({
        name:user.name, class:user.class,
        nickname:user.nickname, score, duration: questions.length*59
      })
    });
  }
}

function goHome(){ showScreen("menu-screen"); }

async function showLeaderboard() {
  const res = await fetch(API_URL+"?action=getRanking");
  const data = await res.json();
  const table = document.getElementById("leaderboard-table");
  table.innerHTML = "<tr><th>Hạng</th><th>Tên</th><th>Lớp</th><th>Điểm</th></tr>";
  data.forEach((r,i)=>{
    let style = i===0?"style='color:gold;font-weight:bold'":
                i===1?"style='color:silver;font-weight:bold'":
                i===2?"style='color:#cd7f32;font-weight:bold'":"";
    table.innerHTML += `<tr ${style}><td>${i+1}</td><td>${r.nickname}</td><td>${r.class}</td><td>${r.score}</td></tr>`;
  });
  showScreen("leaderboard-screen");
}

// Âm thanh
const correctSound = new Audio("https://www.soundjay.com/buttons/sounds/button-4.mp3");
const wrongSound = new Audio("https://www.soundjay.com/buttons/sounds/button-10.mp3");
const timeoutSound = new Audio("https://www.soundjay.com/button/beep-07.wav");

function toggleSound(){
  soundOn=!soundOn;
  document.getElementById("sound-toggle").innerText = soundOn?"🔊":"🔇";
}

function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
