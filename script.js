let user = {};
let questions = [];
let currentMode = "practice";
let startTime = 0;

const API_URL = "YOUR_GOOGLE_SCRIPT_EXEC_URL"; // <--- thay bằng API của bạn

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function login() {
  const name = document.getElementById("name").value;
  const classVal = document.getElementById("class").value;
  const nickname = document.getElementById("nickname").value;
  if (!name || !classVal || !nickname) { alert("Nhập đầy đủ thông tin!"); return; }
  user = {name, class: classVal, nickname};
  localStorage.setItem("toan8user", JSON.stringify(user));
  showScreen("menu-screen");
}

function logout() {
  localStorage.removeItem("toan8user");
  showScreen("login-screen");
}

window.onload = () => {
  const saved = localStorage.getItem("toan8user");
  if (saved) { user = JSON.parse(saved); showScreen("menu-screen"); }
};

function startArena() {
  currentMode = "arena";
  startQuiz();
}
function startPractice() {
  currentMode = "practice";
  startQuiz();
}

function startQuiz() {
  fetch("questions.json")
    .then(res => res.json())
    .then(data => {
      questions = shuffle(data).slice(0,20);
      renderQuiz();
      startTime = Date.now();
      showScreen("quiz-screen");
    });
}

function renderQuiz() {
  const container = document.getElementById("quiz-container");
  container.innerHTML = "";
  questions.forEach((q,i)=>{
    const card = document.createElement("div");
    card.className="question-card";
    card.innerHTML = `<b>Câu ${i+1}:</b> ${q.question}<br>` +
      q.options.map(opt=>`<label><input type="radio" name="q${i}" value="${opt}"> ${opt}</label><br>`).join("");
    container.appendChild(card);
  });
}

function submitQuiz() {
  let score = 0;
  questions.forEach((q,i)=>{
    const chosen = document.querySelector(`input[name="q${i}"]:checked`);
    if (chosen && chosen.value===q.answer) score++;
  });
  const duration = Math.round((Date.now()-startTime)/1000);
  document.getElementById("result-text").innerText =
    `Bạn đúng ${score}/${questions.length} câu. Thời gian: ${duration} giây.`;
  showScreen("result-screen");
  if (currentMode==="arena") sendScore(score,duration);
}

function backToMenu(){ showScreen("menu-screen"); }

function sendScore(score,duration){
  fetch(API_URL,{
    method:"POST",
    body: JSON.stringify({
      name:user.name,
      class:user.class,
      nickname:user.nickname,
      score:score,
      duration:duration
    }),
    headers:{"Content-Type":"application/json"}
  }).then(r=>r.json()).then(d=>console.log("Đã gửi điểm",d))
  .catch(err=>console.error(err));
}

function showLeaderboard(){
  fetch(API_URL+"?action=getRanking")
    .then(res=>res.json())
    .then(data=>{
      const table=document.getElementById("leaderboard-table");
      table.innerHTML="<tr><th>Hạng</th><th>Tên</th><th>Lớp</th><th>Nick</th><th>Điểm</th><th>Thời gian</th></tr>";
      data.forEach((row,i)=>{
        table.innerHTML+=`<tr><td>${i+1}</td><td>${row.name}</td><td>${row.class}</td><td>${row.nickname}</td><td>${row.score}</td><td>${row.duration}</td></tr>`;
      });
      showScreen("leaderboard-screen");
    });
}

function shuffle(a){ return a.sort(()=>Math.random()-0.5); }
