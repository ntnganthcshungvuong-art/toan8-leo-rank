let currentUser = null;
let questions = [];
let currentIndex = 0;
let score = 0;
let timer;
let duration = 59;
let audioOn = true;

// Âm thanh
const snd = {
  click: new Audio("click.mp3"),
  correct: new Audio("correct.mp3"),
  wrong: new Audio("wrong.mp3"),
  timeout: new Audio("timeout.mp3")
};

function login(){
  const name = document.getElementById("fullname").value.trim();
  const cls = document.getElementById("classname").value;
  const nick = document.getElementById("nickname").value.trim();
  if(!name || !cls || !nick) { alert("Nhập đầy đủ thông tin!"); return; }
  currentUser = {name, cls, nick};
  document.getElementById("profile").textContent = `${name} - ${cls} (${nick})`;
  showScreen("menuScreen");
}

function logout(){ currentUser = null; showScreen("loginScreen"); }

function showMenu(){ showScreen("menuScreen"); }

function showScreen(id){
  document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function toggleAudio(){
  audioOn = !audioOn;
  document.getElementById("audioBtn").textContent = audioOn?"🔊":"🔈";
  if(audioOn){ snd.click.play().catch(()=>{}); }
}

function startPractice(){ loadQuestions("questions_mix13.json",10); }
function startArena(){ loadQuestions("questions_mix13.json",20); }

function loadQuestions(file, total){
  fetch(file).then(r=>r.json()).then(data=>{
    questions = shuffle(data).slice(0,total);
    currentIndex=0; score=0;
    showScreen("quizScreen");
    showQuestion();
  });
}

function showQuestion(){
  const q = questions[currentIndex];
  document.getElementById("questionText").innerHTML = q.question;
  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML="";
  q.options.forEach(opt=>{
    const div=document.createElement("div");
    div.className="answer";
    div.textContent=opt;
    div.onclick=()=>selectAnswer(div,opt,q.answer);
    answersDiv.appendChild(div);
  });
  document.getElementById("nextBtn").disabled=true;
  startTimer();
}

let selectedAnswer=null;
function selectAnswer(div,opt,correct){
  document.querySelectorAll(".answer").forEach(a=>a.classList.remove("selected"));
  div.classList.add("selected");
  selectedAnswer={opt,correct};
  document.getElementById("nextBtn").disabled=false;
}

function nextQuestion(){
  clearInterval(timer);
  if(selectedAnswer){
    if(selectedAnswer.opt===selectedAnswer.correct){
      score++; if(audioOn) snd.correct.play();
    } else { if(audioOn) snd.wrong.play(); }
  }
  currentIndex++;
  if(currentIndex<questions.length){ showQuestion(); }
  else { finishQuiz(); }
}

function startTimer(){
  let time=duration;
  const bar=document.getElementById("timerBar");
  bar.style.width="100%"; bar.style.background="green";
  timer=setInterval(()=>{
    time--;
    bar.style.width=(time/duration*100)+"%";
    if(time<20) bar.style.background="orange";
    if(time<10) bar.style.background="red";
    if(time<=0){
      clearInterval(timer);
      if(audioOn) snd.timeout.play();
      nextQuestion();
    }
  },1000);
}

function finishQuiz(){
  showScreen("resultScreen");
  document.getElementById("resultText").textContent=`Điểm: ${score}/${questions.length}`;
  // TODO: gửi API ở chế độ đấu trường
}

function showLeaderboard(){
  showScreen("leaderboardScreen");
  document.getElementById("leaderboardList").innerHTML="<li>Chức năng API</li>";
}

function shuffle(a){ return a.sort(()=>Math.random()-0.5); }
const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";

function finishQuiz(){
  showScreen("resultScreen");
  document.getElementById("resultText").textContent=`Điểm: ${score}/${questions.length}`;

  // Nếu đang ở chế độ đấu trường thì gửi kết quả
  if(questions.length === 20 && currentUser){
    const payload = {
      timestamp: new Date().toLocaleString("vi-VN"),
      name: currentUser.name,
      class: currentUser.cls,
      nickname: currentUser.nick,
      score: score,
      total: questions.length,
      duration: duration
    };
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(r=>r.json())
    .then(d=>console.log("Gửi thành công",d))
    .catch(e=>console.error("Lỗi gửi API",e));
  }
}

function showLeaderboard(){
  showScreen("leaderboardScreen");
  const list = document.getElementById("leaderboardList");
  list.innerHTML = "<li>Đang tải...</li>";

  fetch(API_URL)
    .then(r=>r.json())
    .then(data=>{
      list.innerHTML="";
      // lấy top 10
      data.slice(0,10).forEach((p,i)=>{
        const li=document.createElement("li");
        li.textContent = `${i+1}. ${p.name} - ${p.class} (${p.nickname}) : ${p.score}đ`;
        if(i===0) li.style.color="gold";
        if(i===1) li.style.color="silver";
        if(i===2) li.style.color="#cd7f32";
        list.appendChild(li);
      });
    })
    .catch(e=>{
      list.innerHTML="<li>Lỗi tải bảng xếp hạng</li>";
      console.error(e);
    });
}
