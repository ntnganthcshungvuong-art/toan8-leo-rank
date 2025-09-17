/************ CẤU HÌNH ************/
const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";
const QUESTION_FILE = "questions_chap1.json"; // có thể đổi sang questions_mix13.json
let audioOn = true;

/************ ÂM THANH ************/
const SND = {
  click: new Audio("click.mp3"),
  correct: new Audio("correct.mp3"),
  wrong: new Audio("wrong.mp3"),
  timeout: new Audio("timeout.mp3"),
  win: new Audio("win.mp3"),
};
Object.values(SND).forEach(a => { try{ a.preload="auto"; a.load(); }catch(e){} });
function play(a){ if(audioOn) { try{ a.currentTime=0; a.play(); }catch(e){} } }

/************ TIỆN ÍCH ************/
const $ = s => document.querySelector(s);
function show(id){
  document.querySelectorAll(".screen").forEach(el => { el.classList.remove("active"); el.style.display="none"; });
  const el = document.getElementById(id); el.style.display="block"; el.classList.add("active");
}
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr; }
function supify(s){ return (s||"").replace(/([a-zA-Z0-9\)])\^(\d+)/g,'$1<sup>$2</sup>'); }

/************ CHẶN PULL-TO-REFRESH ************/
let _startY = 0;
document.addEventListener("touchstart", e => { _startY = e.touches[0].clientY; }, {passive:true});
document.addEventListener("touchmove", e => {
  const y = e.touches[0].clientY;
  if (window.scrollY <= 0 && y > _startY) { e.preventDefault(); }
}, {passive:false});

/************ COUNTDOWN 11/11 12:00 ************/
(function initCountdown(){
  const t = new Date(new Date().getFullYear(), 10, 11, 12, 0, 0); // 11/11 12:00
  function tick(){
    const now = new Date(), diff = Math.max(0, t - now);
    const days = Math.ceil(diff/(1000*60*60*24));
    const el = $("#countdownText"); if(el) el.textContent = `⏳ Còn ${days} ngày nữa trao thưởng Top 10 (12:00 trưa 11/11). Quyết chiến thôi!`;
  }
  tick(); setInterval(tick, 3600*1000);
})();

/************ USER / RANK / AVATAR ************/
let currentUser = null;

function rankName(points){
  if(points>=300) return "Thách Đấu";
  if(points>=250) return "Cao Thủ II";
  if(points>=200) return "Cao Thủ I";
  if(points>=150) return "Tinh Anh";
  if(points>=120) return "Kim Cương";
  if(points>=80)  return "Vàng";
  if(points>=40)  return "Bạc";
  return "Đồng";
}
function rankGlow(points){
  if(points>=300) return "0 0 28px 10px rgba(255, 0, 0, .55)";
  if(points>=250) return "0 0 26px 8px rgba(255, 165, 0, .55)";
  if(points>=200) return "0 0 24px 8px rgba(255, 215, 0, .55)";
  if(points>=150) return "0 0 22px 8px rgba(173, 216, 230, .6)";
  if(points>=120) return "0 0 20px 8px rgba(0, 191, 255, .6)";
  if(points>=80)  return "0 0 20px 8px rgba(255, 215, 0, .45)";
  if(points>=40)  return "0 0 18px 7px rgba(192, 192, 192, .5)";
  return "0 0 14px 6px rgba(255,255,255,.3)";
}
function avatarByPoints(points){
  if(points>=300) return "legend.png";
  if(points>=250) return "master.png";
  if(points>=200) return "elite.png";
  if(points>=150) return "diamond.png";
  if(points>=120) return "diamond.png";
  if(points>=80)  return "gold.png";
  if(points>=40)  return "silver.png";
  if(points>=10)  return "bac.png";
  return "dong.png";
}

function updateProfileUI(){
  if(!currentUser) return;
  $("#playerName").textContent = `${currentUser.name} – ${currentUser.class}`;
  $("#playerNick").textContent = `Nick: ${currentUser.nickname}`;
  $("#playerAvatar").src = currentUser.avatar || "basic.png";
  $("#playerRank").textContent = rankName(currentUser.points||0);
  $("#rankGlow").style.boxShadow = rankGlow(currentUser.points||0);
}

function login(){
  const name = $("#fullname").value.trim();
  const cls  = $("#classname").value;
  const nick = $("#nickname").value.trim();
  if(!name || !cls || !nick){ alert("❌ Vui lòng nhập đủ Họ tên – Lớp – Biệt danh"); return; }
  currentUser = JSON.parse(localStorage.getItem("toan8_profile")||"{}");
  currentUser.name=name; currentUser.class=cls; currentUser.nickname=nick;
  currentUser.points = currentUser.points || 0;
  currentUser.avatar = currentUser.avatar || "basic.png";
  localStorage.setItem("toan8_profile", JSON.stringify(currentUser));
  updateProfileUI(); show("menu-screen"); updatePlayerPosition();
  play(SND.click);
}
function logout(){ localStorage.removeItem("toan8_profile"); currentUser=null; show("login-screen"); }

(function restore(){
  const saved = localStorage.getItem("toan8_profile");
  if(saved){ currentUser = JSON.parse(saved); updateProfileUI(); show("menu-screen"); updatePlayerPosition(); }
})();

/************ AUDIO ************/
function toggleAudio(){
  audioOn = !audioOn;
  const sym = audioOn ? "🔊" : "🔈";
  ["#btn-audio-login","#btn-audio-top"].forEach(sel => { const b=$(sel); if(b) b.textContent=sym; });
  if(audioOn) play(SND.click);
}

/************ CÂU HỎI ************/
let allQuestions = [];
async function loadQuestions(){
  if(allQuestions.length) return allQuestions;
  const res = await fetch(QUESTION_FILE);
  const data = await res.json();
questions = [];
for (let key in data) {
  questions = questions.concat(data[key]);
}

  // chuẩn hóa: {question, options[], answer, level}
  allQuestions = data.map(q => ({
    question: supify(q.question),
    options: q.options.map(o => supify(o)),
    answer:  supify(q.answer),
    level:   q.level || "NB"
  }));
  return allQuestions;
}

/************ QUIZ ************/
let questions = [];
let idx = 0;
let score = 0;
let selectedAnswer = null;
let isArena = false;
let timer = null;
let timeLeft = 59;
let totalDuration = 0;

async function startPractice(){ play(SND.click); isArena=false; await loadQuestions(); questions = shuffle([...allQuestions]).slice(0,10); beginQuiz(); }
async function startArena(){ play(SND.click); isArena=true; await loadQuestions(); questions = shuffle([...allQuestions]).slice(0,20); beginQuiz(); }

function beginQuiz(){
  idx=0; score=0; selectedAnswer=null; totalDuration=0;
  show("quiz-screen"); renderQuestion(); startTimer(); updateProgress();
}

function renderQuestion(){
  const q = questions[idx];
  $("#questionBox").innerHTML = q.question;
  const ans = $("#answers"); ans.innerHTML = "";
  q.options.forEach((opt,i)=>{
    const el = document.createElement("div");
    el.className="answer";
    el.innerHTML=opt;
    el.dataset.index = i;
    el.onclick = ()=>{
      play(SND.click);
      if(el.classList.contains("selected")){ el.classList.remove("selected"); selectedAnswer=null; return; }
      document.querySelectorAll("#answers .answer").forEach(a=>a.classList.remove("selected"));
      el.classList.add("selected"); selectedAnswer=i;
    };
    ans.appendChild(el);
  });
}

function updateProgress(){ $("#progressText").textContent = `Câu ${idx+1}/${questions.length}`; }

function startTimer(){
  clearInterval(timer);
  timeLeft=59; updateTimerUI();
  timer=setInterval(()=>{
    timeLeft--; totalDuration++;
    updateTimerUI();
    if(timeLeft<=0){ clearInterval(timer); play(SND.timeout); commitAnswer(null); }
  },1000);
}
function updateTimerUI(){
  $("#timerText").textContent = `${timeLeft}s`;
  const w = Math.max(0,(timeLeft/59)*100);
  const bar = $("#timerBar");
  bar.style.right = (100 - w) + "%";
  if(timeLeft<=10) bar.style.background="#ff3b3b";
  else if(timeLeft<=20) bar.style.background="#ffa53b";
  else bar.style.background="#2ce48d";
}

function nextQuestion(){
  if(selectedAnswer===null){ alert("❗ Hãy chọn một đáp án!"); return; }
  commitAnswer(selectedAnswer);
}
function commitAnswer(ansIndex){
  clearInterval(timer);
  const q = questions[idx];
  const correctIndex = q.options.findIndex(o => o === q.answer);
  if(ansIndex!==null && ansIndex===correctIndex){ score++; play(SND.correct); }
  else if(ansIndex!==null){ play(SND.wrong); }
  idx++;
  if(idx<questions.length){ selectedAnswer=null; renderQuestion(); startTimer(); updateProgress(); }
  else { finishQuiz(); }
}

function finishQuiz(){
  clearInterval(timer);
  const total = questions.length;
  const score10 = (score/total*10);
  let lucky = false;

  if(isArena){
    if(Math.random()<0.01){ lucky=true; currentUser.avatar="rare.png"; }
    let rankGain = score;
    if(lucky) rankGain = Math.round(rankGain*1.2);
    currentUser.points = (currentUser.points||0) + rankGain;
    if(!lucky){ currentUser.avatar = avatarByPoints(currentUser.points); }
    localStorage.setItem("toan8_profile", JSON.stringify(currentUser));
    updateProfileUI();
  }

  $("#resultText").innerHTML = `Bạn đúng <b>${score}</b>/<b>${total}</b> câu → <b>${score10.toFixed(1)}</b> điểm`;
  $("#luckyText").classList.toggle("hidden", !lucky);
  show("result-screen");
  if(isArena){ play(SND.win); sendResult(score10.toFixed(1), totalDuration).then(()=>updatePlayerPosition()); }
}

/************ API ************/
async function sendResult(score10, durationSec){
  try{
    const payload = {
      timestamp: new Date().toLocaleString('vi-VN'),
      name: currentUser?.name || "",
      class: currentUser?.class || "",
      nickname: currentUser?.nickname || "",
      score: Number(score10),
      total: questions.length,
      duration: durationSec
    };
    await fetch(API_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
  }catch(e){ console.error("Send API error", e); }
}
async function showLeaderboard(){
  show("leaderboard-screen");
  const body = $("#lbBody");
  body.innerHTML = `<tr><td colspan="6">Đang tải...</td></tr>`;
  try{
    const res = await fetch(API_URL + "?action=getRanking");
    const rows = await res.json();
    body.innerHTML = "";
    rows.slice(0,10).forEach((r,i)=>{
      const tr = document.createElement("tr");
      if(i===0) tr.classList.add("tr-1");
      if(i===1) tr.classList.add("tr-2");
      if(i===2) tr.classList.add("tr-3");
      const av = document.createElement("img");
      av.src = guessAvatarFromScore(r.score); av.className="lb-avatar";
      const avTd=document.createElement("td"); avTd.appendChild(av);
      tr.innerHTML = `<td>${i+1}</td>`;
      tr.appendChild(avTd);
      tr.innerHTML += `<td>${r.name||""}</td><td>${r.class||""}</td><td>${r.nickname||""}</td><td>${r.score||""}</td>`;
      body.appendChild(tr);
    });
  }catch(e){ body.innerHTML = `<tr><td colspan="6">Không tải được BXH</td></tr>`; }
}
async function updatePlayerPosition(){
  try{
    const res = await fetch(API_URL);
    const all = await res.json();
    const sorted = [...all].sort((a,b)=> Number(b.score)-Number(a.score));
    const pos = sorted.findIndex(r =>
      (r.name||"")===(currentUser?.name||"") &&
      (r.class||"")===(currentUser?.class||"") &&
      (r.nickname||"")===(currentUser?.nickname||"")
    ) + 1;
    $("#playerPos").textContent = pos>0 ? `#${pos} trên BXH` : `#– trên BXH`;
  }catch(e){ $("#playerPos").textContent = `#– trên BXH`; }
}
function guessAvatarFromScore(s){
  const sc = Number(s||0);
  if(sc>=9.5) return "gold.png";
  if(sc>=8.0) return "silver.png";
  if(sc>=6.5) return "bac.png";
  return "dong.png";
}

/************ NAV & EVENTS ************/
function showMenu(){ updateProfileUI(); show("menu-screen"); }

window.addEventListener("DOMContentLoaded", ()=>{
  // Login
  $("#btn-start")?.addEventListener("click", login);
  $("#btn-logout")?.addEventListener("click", logout);

  // Audio
  $("#btn-audio-login")?.addEventListener("click", toggleAudio);
  $("#btn-audio-top")?.addEventListener("click", toggleAudio);

  // Menu actions
  $("#btn-practice")?.addEventListener("click", startPractice);
  $("#btn-arena")?.addEventListener("click", startArena);
  $("#btn-leaderboard")?.addEventListener("click", showLeaderboard);

  // In-quiz nav
  $("#btn-home")?.addEventListener("click", showMenu);
  $("#btn-back-menu")?.addEventListener("click", showMenu);
  $("#btn-lb-back")?.addEventListener("click", showMenu);
  $("#nextBtn")?.addEventListener("click", nextQuestion);
});
