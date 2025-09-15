const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";

let questions = [];
let currentIndex = 0, score = 0, mode = "practice", timer, timeLeft=59;

async function loadQuestions(){
  const res = await fetch("questions.json");
  questions = await res.json();
}

function showScreen(id,m){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id==="quiz"){ mode=m; startQuiz(); }
}

function startQuiz(){
  currentIndex=0; score=0;
  showQuestion();
}

function showQuestion(){
  if(currentIndex>=10){ endQuiz(); return; }
  const q = questions[currentIndex];
  let html = `<h3><b>Câu ${currentIndex+1}:</b> ${q.question}</h3>`;
  q.options.forEach((opt,i)=>{
    html+=`<div class="option" onclick="selectOption(${i})">${opt}</div>`;
  });
  document.getElementById("quiz-container").innerHTML=html;
  document.getElementById("next-btn").style.display="none";
  startTimer();
}

function selectOption(i){
  document.querySelectorAll(".option").forEach((o,idx)=>{
    o.classList.toggle("selected", idx===i);
  });
  document.getElementById("next-btn").style.display="block";
}

function nextQuestion(){
  const selected=document.querySelector(".option.selected");
  if(!selected){return;}
  if(selected.textContent===questions[currentIndex].answer){ score++; }
  currentIndex++; showQuestion();
}

function startTimer(){
  clearInterval(timer); timeLeft=59;
  timer=setInterval(()=>{
    timeLeft--; updateTimerBar();
    if(timeLeft<=0){ clearInterval(timer); nextQuestion(); }
  },1000);
  updateTimerBar();
}

function updateTimerBar(){
  const bar=document.getElementById("timer-bar");
  bar.style.background=`linear-gradient(90deg,#4caf50 ${(timeLeft/59)*100}%,#ddd 0%)`;
  document.getElementById("timer-text").innerText=timeLeft+"s";
}

function endQuiz(){
  clearInterval(timer);
  document.getElementById("score-text").innerText = 
    `Bạn đúng ${score}/10 câu.`;
  showScreen("result");
  if(mode==="arena"){ sendResult(); }
}

async function sendResult(){
  await fetch(API_URL,{method:"POST",body:JSON.stringify({name:"HS",class:"8A1",nickname:"nick",score:score,duration:"10p"})});
}

async function showLeaderboard(){
  showScreen("leaderboard");
  const res=await fetch(API_URL+"?action=getRanking");
  const data=await res.json();
  let html="<tr><th>Hạng</th><th>Tên</th><th>Lớp</th><th>Điểm</th></tr>";
  data.forEach((r,i)=>{
    html+=`<tr><td>${i+1}</td><td>${r.nickname}</td><td>${r.class}</td><td>${r.score}</td></tr>`;
  });
  document.getElementById("leaderboard-table").innerHTML=html;
}

function restartQuiz(){ showScreen("quiz",mode); }
loadQuestions();
