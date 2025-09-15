const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";
let user = {};
let questions = [];
let currentMode = "";
let startTime;

async function login() {
  user.name = document.getElementById("name").value;
  user.class = document.getElementById("class").value;
  user.nickname = document.getElementById("nickname").value;
  if (!user.name || !user.class || !user.nickname) {
    alert("Vui lòng nhập đầy đủ thông tin!"); return;
  }
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("menuScreen").classList.remove("hidden");
  document.getElementById("userNick").innerText = user.nickname;
}

function logout() {
  user = {};
  document.getElementById("menuScreen").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
}

async function startQuiz(mode) {
  currentMode = mode;
  startTime = Date.now();
  const res = await fetch("questions.json");
  questions = await res.json();
  questions = questions.sort(() => 0.5 - Math.random()).slice(0, 20);

  document.getElementById("menuScreen").classList.add("hidden");
  document.getElementById("quizScreen").classList.remove("hidden");
  document.getElementById("modeTitle").innerText = (mode==="arena"?"Đấu Trường":"Luyện Tập");
  renderQuiz();
}

function renderQuiz() {
  let html = "";
  questions.forEach((q,i) => {
    html += `<div>
      <p><b>Câu ${i+1}:</b> ${q.question}</p>`;
    q.options.forEach(opt=>{
      html += `<label><input type="radio" name="q${i}" value="${opt}"> ${opt}</label><br>`;
    });
    html += `</div>`;
  });
  document.getElementById("quizContainer").innerHTML = html;
}

async function submitQuiz() {
  let score=0;
  questions.forEach((q,i)=>{
    const ans=document.querySelector(`input[name="q${i}"]:checked`);
    if(ans && ans.value===q.answer) score++;
  });
  let durationSec = Math.floor((Date.now()-startTime)/1000);
  alert(`Bạn đúng ${score}/${questions.length} câu!`);

  if(currentMode==="arena"){
    await fetch(API_URL, {
      method:"POST",
      body: JSON.stringify({
        name:user.name, class:user.class, nickname:user.nickname,
        score:score, duration: durationSec+"s"
      }),
      headers:{"Content-Type":"application/json"}
    });
  }

  document.getElementById("quizScreen").classList.add("hidden");
  document.getElementById("menuScreen").classList.remove("hidden");
}

async function showLeaderboard() {
  document.getElementById("menuScreen").classList.add("hidden");
  document.getElementById("leaderboardScreen").classList.remove("hidden");
  const res = await fetch(API_URL+"?action=getRanking");
  const data = await res.json();
  let html="<tr><th>Hạng</th><th>Tên</th><th>Lớp</th><th>Nickname</th><th>Điểm</th><th>Thời gian</th></tr>";
  data.forEach((r,i)=>{
    html+=`<tr><td>${i+1}</td><td>${r.name}</td><td>${r.class}</td><td>${r.nickname}</td><td>${r.score}</td><td>${r.duration}</td></tr>`;
  });
  document.getElementById("leaderboard").innerHTML=html;
}
function backToMenu(){
  document.getElementById("leaderboardScreen").classList.add("hidden");
  document.getElementById("menuScreen").classList.remove("hidden");
}
