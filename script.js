const API_URL="https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";

let currentUser=null, questions=[], currentIndex=0, selectedAnswer=null;
let score=0, timer=null, timeLeft=59, mode="practice", audioOn=true;

const $=id=>document.querySelector(id);

const snd={
  click:new Audio("sounds/click.mp3"),
  correct:new Audio("sounds/correct.mp3"),
  wrong:new Audio("sounds/wrong.mp3"),
  timeout:new Audio("sounds/timeout.mp3")
};

function play(a){ if(audioOn){a.currentTime=0; a.play();} }
function toggleAudio(){audioOn=!audioOn; alert("Âm thanh "+(audioOn?"bật":"tắt"));}

function supify(s){
  return (s||"").replace(/([a-zA-Z0-9\)])\^(\d+)/g,'$1<sup>$2</sup>');
}

function show(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  $(id).classList.add("active");
}

function login(){
  const fullname=$("#fullname").value.trim();
  const clazz=$("#class").value;
  const nickname=$("#nickname").value.trim();
  if(!fullname||!clazz||!nickname){alert("Nhập đủ thông tin!");return;}
  currentUser={fullname,clazz,nickname};
  $("#userInfo").innerText=`${fullname} - ${clazz} (${nickname})`;
  show("#menuScreen");
}

function logout(){currentUser=null;show("#loginScreen");}

async function loadQuestions(){
  const res=await fetch("questions_mix13.json");
  return await res.json();
}

async function startPractice(){
  mode="practice";questions=await loadQuestions();
  questions=questions.sort(()=>Math.random()-0.5).slice(0,10);
  currentIndex=0;score=0;nextQuestion();show("#quizScreen");
}
async function startArena(){
  mode="arena";questions=await loadQuestions();
  questions=questions.sort(()=>Math.random()-0.5).slice(0,20);
  currentIndex=0;score=0;nextQuestion();show("#quizScreen");
}

function nextQuestion(){
  if(currentIndex>0){
    if(selectedAnswer===questions[currentIndex-1].answer) {score++;}
  }
  if(currentIndex>=questions.length){endQuiz();return;}
  const q=questions[currentIndex];
  $("#questionBox").innerHTML=supify(q.question);
  const box=$("#answers");box.innerHTML="";
  q.options.forEach(opt=>{
    const el=document.createElement("div");
    el.className="answer";
    el.innerHTML=supify(opt);
    el.onclick=()=>{
      play(snd.click);
      if(el.classList.contains("selected")){
        el.classList.remove("selected");selectedAnswer=null;
      } else {
        document.querySelectorAll("#answers .answer").forEach(a=>a.classList.remove("selected"));
        el.classList.add("selected");selectedAnswer=opt;
      }
    };
    box.appendChild(el);
  });
  selectedAnswer=null;currentIndex++;startTimer();
}

function startTimer(){
  clearInterval(timer);timeLeft=59;updateTimer();
  timer=setInterval(()=>{timeLeft--;updateTimer();if(timeLeft<=0){clearInterval(timer);play(snd.timeout);nextQuestion();}},1000);
}
function updateTimer(){
  const bar=$("#timerBar");bar.style.width=(timeLeft/59*100)+"%";
  if(timeLeft>30)bar.style.background="green";
  else if(timeLeft>10)bar.style.background="orange";
  else bar.style.background="red";
}

function endQuiz(){
  clearInterval(timer);
  const total=questions.length;
  const text=`Bạn đúng ${score}/${total} câu. Điểm ${(score/total*10).toFixed(1)}`;
  $("#resultText").innerText=text;
  show("#resultScreen");
  if(mode==="arena"){submitResult(score,total);}
}

function showMenu(){show("#menuScreen");}

async function submitResult(sc,total){
  const payload={fullname:currentUser.fullname,clazz:currentUser.clazz,nickname:currentUser.nickname,score:(sc/total*10).toFixed(1),total:total,timestamp:new Date().toLocaleString()};
  try{
    await fetch(API_URL,{method:"POST",body:JSON.stringify(payload)});
  }catch(e){console.error(e);}
}

async function showLeaderboard(){
  show("#leaderboardScreen");
  try{
    const res=await fetch(API_URL);const data=await res.json();
    const tbl=$("#leaderboardTable");tbl.innerHTML="<tr><th>Hạng</th><th>Tên</th><th>Lớp</th><th>Nick</th><th>Điểm</th></tr>";
    data.slice(0,10).forEach((r,i)=>{
      tbl.innerHTML+=`<tr><td>${i+1}</td><td>${r.fullname}</td><td>${r.clazz}</td><td>${r.nickname}</td><td>${r.score}</td></tr>`;
    });
  }catch(e){console.error(e);}
}
