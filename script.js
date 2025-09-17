// ================== GLOBAL ==================
let currentMode = null;
let currentQuestion = 0;
let score = 0;
let questions = [];
let selectedAnswer = null;

// ================== UTILITIES ==================
function switchScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// ================== LOAD QUIZ ==================
function startQuiz(mode) {
  currentMode = mode;
  currentQuestion = 0;
  score = 0;
  selectedAnswer = null;

  let file = "questions_chap1.json"; // chỉnh sang chap3 hoặc mix nếu muốn
  fetch(file)
    .then(res => res.json())
    .then(data => {
      // data có dạng {Bai1: [...], Bai2: [...]}
      let qList = [];
      for (let key in data) {
        qList = qList.concat(data[key]);
      }
      qList = shuffle(qList);

      if (mode === "practice") {
        questions = qList.slice(0, 10);
      } else if (mode === "arena") {
        questions = qList.slice(0, 20);
      }

      switchScreen("quiz-screen");
      showQuestion();
    });
}

// ================== SHOW QUESTION ==================
function showQuestion() {
  if (currentQuestion >= questions.length) {
    endQuiz();
    return;
  }

  const q = questions[currentQuestion];
  document.getElementById("questionBox").innerHTML = q.q;
  const answersBox = document.getElementById("answers");
  answersBox.innerHTML = "";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("div");
    btn.className = "answer";
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".answer").forEach(a => a.classList.remove("selected"));
      btn.classList.add("selected");
      selectedAnswer = opt;
    });
    answersBox.appendChild(btn);
  });

  document.getElementById("progressText").textContent =
    `Câu ${currentQuestion + 1}/${questions.length}`;
}

// ================== NEXT QUESTION ==================
document.getElementById("nextBtn").addEventListener("click", () => {
  if (!selectedAnswer) return; // chưa chọn thì không cho next
  const q = questions[currentQuestion];
  if (selectedAnswer === q.a) score++;

  currentQuestion++;
  selectedAnswer = null;
  showQuestion();
});

// ================== END QUIZ ==================
function endQuiz() {
  switchScreen("result-screen");
  let resultText = `${score}/${questions.length} câu đúng`;
  if (currentMode === "arena") {
    let point = (score / questions.length) * 10;
    resultText += ` → ${point.toFixed(1)} điểm`;
    sendResult(point);
  }
  document.getElementById("resultText").textContent = resultText;
}

// ================== API SUBMIT ==================
function sendResult(point) {
  const name = localStorage.getItem("fullname") || "Ẩn danh";
  const clazz = localStorage.getItem("classname") || "";
  const nick = localStorage.getItem("nickname") || "";

  fetch("https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec", {
    method: "POST",
    body: JSON.stringify({
      timestamp: new Date().toLocaleString("vi-VN"),
      name: name,
      class: clazz,
      nickname: nick,
      score: point,
      duration: questions.length
    })
  });
}

// ================== EVENT BINDINGS ==================
document.getElementById("btn-practice").addEventListener("click", () => {
  startQuiz("practice");
});

document.getElementById("btn-arena").addEventListener("click", () => {
  startQuiz("arena");
});

document.getElementById("btn-leaderboard").addEventListener("click", () => {
  loadLeaderboard();
  switchScreen("leaderboard-screen");
});

document.getElementById("btn-home").addEventListener("click", () => {
  switchScreen("menu-screen");
});

document.getElementById("btn-lb-back").addEventListener("click", () => {
  switchScreen("menu-screen");
});

document.getElementById("btn-back-menu").addEventListener("click", () => {
  switchScreen("menu-screen");
});

// ================== LEADERBOARD ==================
function loadLeaderboard() {
  fetch("https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec")
    .then(res => res.json())
    .then(rows => {
      const tbody = document.getElementById("lbBody");
      tbody.innerHTML = "";
      rows.slice(0, 10).forEach((r, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${i + 1}</td><td>🥇</td><td>${r.name}</td><td>${r.class}</td><td>${r.nickname}</td><td>${r.score}</td>`;
        tbody.appendChild(tr);
      });
    });
}

// ================== LOGIN ==================
document.getElementById("btn-start").addEventListener("click", () => {
  const name = document.getElementById("fullname").value;
  const clazz = document.getElementById("classname").value;
  const nick = document.getElementById("nickname").value;
  if (!name || !clazz || !nick) {
    alert("Vui lòng nhập đầy đủ thông tin!");
    return;
  }
  localStorage.setItem("fullname", name);
  localStorage.setItem("classname", clazz);
  localStorage.setItem("nickname", nick);
  document.getElementById("playerName").textContent = name + " (" + clazz + ")";
  document.getElementById("playerNick").textContent = nick;
  switchScreen("menu-screen");
});
