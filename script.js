const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";
let currentUser = {};
let questions = [];
let currentMode = "practice";

async function login() {
  const name = document.getElementById("name").value.trim();
  const className = document.getElementById("class").value;
  const nickname = document.getElementById("nickname").value.trim();

  if (!name || !className || !nickname) {
    alert("Vui lòng nhập đủ thông tin!");
    return;
  }

  currentUser = { name, class: className, nickname };
  document.getElementById("player-name").innerText = nickname;
  showScreen("menu-screen");
}

function logout() {
  currentUser = {};
  showScreen("login-screen");
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

async function startQuiz(mode) {
  currentMode = mode;
  questions = await fetch("questions.json").then(res => res.json());
  questions = shuffle(questions).slice(0, 10);

  const container = document.getElementById("quiz-container");
  container.innerHTML = "";
  questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question-block";
    div.innerHTML = `
      <div class="question">${i+1}. ${q.question}</div>
      ${q.options.map(opt => `
        <label class="option">
          <input type="radio" name="q${i}" value="${opt}"> ${opt}
        </label>`).join("")}
    `;
    container.appendChild(div);
  });

  showScreen("quiz-screen");
}

function submitQuiz() {
  let score = 0;
  questions.forEach((q, i) => {
    const chosen = document.querySelector(`input[name="q${i}"]:checked`);
    if (chosen && chosen.value === q.answer) score++;
  });

  if (currentMode === "arena") {
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "addScore",
        name: currentUser.name,
        class: currentUser.class,
        nickname: currentUser.nickname,
        score,
        duration: 0
      })
    });
  }

  document.getElementById("result-text").innerText =
    currentMode === "arena" ?
    `Bạn đúng ${score}/10. Điểm đã được lưu BXH!` :
    `Bạn đúng ${score}/10. (Chế độ luyện tập, không lưu BXH)`;

  showScreen("result-screen");
}

async function showRanking() {
  const res = await fetch(API_URL + "?action=getRanking");
  const data = await res.json();
  const table = document.getElementById("ranking-table");
  table.innerHTML = "<tr><th>Hạng</th><th>Biệt danh</th><th>Lớp</th><th>Điểm</th></tr>";
  data.forEach((row, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i+1}</td><td>${row.nickname}</td><td>${row.class}</td><td>${row.score}</td>`;
    table.appendChild(tr);
  });
  showScreen("ranking-screen");
}

function backToMenu() { showScreen("menu-screen"); }

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
