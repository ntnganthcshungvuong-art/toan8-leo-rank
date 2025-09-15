const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";

let questions = [];
let current = 0;
let score = 0;
let timer;
let timeLeft = 59;
let mode = "practice";

// Countdown trên trang chủ
function startCountdown() {
  const target = new Date("2025-11-11T12:00:00").getTime();
  setInterval(() => {
    const now = new Date().getTime();
    const diff = target - now;
    if (diff <= 0) {
      document.getElementById("countdown").innerText = "🎉 Đã đến giờ trao thưởng Top 10!";
      return;
    }
    const d = Math.floor(diff / (1000*60*60*24));
    const h = Math.floor((diff % (1000*60*60*24))/(1000*60*60));
    const m = Math.floor((diff % (1000*60*60))/(1000*60));
    const s = Math.floor((diff % (1000*60))/1000);
    document.getElementById("countdown").innerText = 
      `Còn ${d} ngày ${h}h ${m}m ${s}s đến trao thưởng Top 10`;
  }, 1000);
}

// Bắt đầu
function startPractice() { mode="practice"; startQuiz(); }
function startArena() { mode="arena"; startQuiz(); }

function startQuiz() {
  fetch("questions.json")
    .then(r => r.json())
    .then(data => {
      questions = data.sort(() => 0.5 - Math.random()).slice(0,10);
      current=0; score=0;
      document.getElementById("home-screen").classList.remove("active");
      document.getElementById("quiz-screen").classList.add("active");
      showQuestion();
    });
}

function showQuestion() {
  if(current>=questions.length) return endQuiz();
  const q = questions[current];
  let html = `<h3>${q.question}</h3>`;
  q.options.forEach(opt=>{
    html+=`<div class="answer" onclick="chooseAnswer('${opt}')">${opt}</div>`;
  });
  document.getElementById("quiz-container").innerHTML = html;
  startTimer();
}

function chooseAnswer(opt){
  if(opt===questions[current].answer) score++;
  nextQuestion();
}

function nextQuestion(){
  current++;
  if(current<questions.length) showQuestion();
  else endQuiz();
}

function startTimer(){
  clearInterval(timer);
  timeLeft=59;
  const progress = document.getElementById("timer-progress");
  timer = setInterval(()=>{
    timeLeft--;
    progress.style.width = (timeLeft/59*100)+"%";
    progress.style.background = timeLeft<20?"red":timeLeft<40?"orange":"green";
    if(timeLeft<=0){ clearInterval(timer); nextQuestion(); }
  },1000);
}

function endQuiz(){
  clearInterval(timer);
  document.getElementById("quiz-screen").classList.remove("active");
  document.getElementById("result-popup").style.display="block";
  document.getElementById("score-text").innerText = `Bạn đạt ${score}/${questions.length} điểm`;
  if(mode==="arena"){
    // Gửi điểm lên API
    fetch(API_URL,{
      method:"POST",
      body:JSON.stringify({name:"HS",class:"8A1",nickname:"test",score:score,duration:questions.length*59})
    });
  }
}

function goHome(){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById("result-popup").style.display="none";
  document.getElementById("home-screen").classList.add("active");
}

function restart(){
  document.getElementById("result-popup").style.display="none";
  startQuiz();
}

function showLeaderboard(){
  fetch(API_URL+"?action=getRanking")
    .then(r=>r.json())
    .then(rows=>{
      let html="<tr><th>STT</th><th>Tên</th><th>Lớp</th><th>Nick</th><th>Điểm</th></tr>";
      rows.forEach((r,i)=>{
        html+=`<tr><td>${i+1}</td><td>${r.name}</td><td>${r.class}</td><td>${r.nickname}</td><td>${r.score}</td></tr>`;
      });
      document.getElementById("leaderboard").innerHTML=html;
      document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
      document.getElementById("leaderboard-screen").classList.add("active");
    });
}

window.onload=startCountdown;
