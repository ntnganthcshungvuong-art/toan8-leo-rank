// ========= CẤU HÌNH =========
const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";
const QUESTION_FILE = "questions_chap1.json"; // dữ liệu mặc định (bạn có thể đổi sang mix13)

// ========= TRẠNG THÁI =========
let currentUser = null;
let audioOn = true;

let allQuestions = [];
let questions = [];
let idx = 0;
let score = 0;
let selectedAnswer = null;
let isArena = false;

let timer = null;
let timeLeft = 59;
let totalDuration = 0; // tổng giây

// ========= ÂM THANH =========
const snd = {
  click: new Audio("click.mp3"),
  correct: new Audio("correct.mp3"),
  wrong: new Audio("wrong.mp3"),
  timeout: new Audio("timeout.mp3"),
  win: new Audio("win.mp3"),
};
Object.values(snd).forEach(a => { a.preload="auto"; a.volume=1.0; });

// ========= TIỆN ÍCH =========
const $ = s => document.querySelector(s);
function show(id){
  document.querySelectorAll(".screen").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".screen").forEach(el => el.style.display="none");
  const el = document.getElementById(id);
  el.style.display = "block"; el.classList.add("active");
}
function play(a){ if(audioOn){ try{ a.currentTime=0; a.play(); }catch(e){} } }
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr; }
// đổi ^n → <sup>n</sup> (…x^2, (a+b)^3, y^10…)
function supify(s){ return (s||"").replace(/([a-zA-Z0-9\)])\^(\d+)/g,'$1<sup>$2</sup>'); }

// ========= COUNTDOWN 11/11 12:00 =========
(function initCountdown(){
  const t = new Date(new Date().getFullYear(), 10, 11, 12, 0, 0); // 11/11 12:00
  function tick(){
    const now = new Date(), diff = Math.max(0, t - now);
    const days = Math.ceil(diff/(1000*60*60*24));
    $("#countdownText").textContent = `⏳ Còn ${days} ngày nữa trao thưởng Top 10 (12:00 trưa 11/11). Quyết chiến thôi!`;
  }
  tick(); setInterval(tick, 3600*1000);
})();

// ========= LOGIN =========
function updateProfileUI(){
  if(!currentUser) return;
  $("#playerName").textContent = `${currentUser.name} – ${currentUser.class}`;
  $("#playerNick").textContent = `Nick: ${currentUser.nickname}`;
  $("#playerAvatar").src = currentUser.avatar || "basic.png";
  $("#playerRank").textContent = rankName(currentUser.points||0);
  // glow theo rank
  $("#rankGlow").style.boxShadow = rankGlowShadow(currentUser.points||0);
}

function login(){
  const name = $("#fullname").value.trim();
  const cls  = $("#classname").value;
  const nick = $("#nickname").value.trim();
  if(!name || !cls || !nick){ alert("Vui lòng nhập đủ Họ tên – Lớp – Biệt danh"); return; }
  currentUser = JSON.parse(localStorage.getItem("toan8_profile")||"{}");
  currentUser.name=name; currentUser.class=cls; currentUser.nickname=nick;
  currentUser.points = currentUser.points || 0;
  currentUser.avatar = currentUser.avatar || "basic.png";
  localStorage.setItem("toan8_profile", JSON.stringify(currentUser));
  updateProfileUI(); show("menu-screen");
  updatePlayerPosition();
}
function logout(){ localStorage.removeItem("toan8_profile"); currentUser=null; show("login-screen"); }

// phục hồi nếu có
(function restore(){
  const saved = localStorage.getItem("toan8_profile");
  if(saved){ currentUser = JSON.parse(saved); updateProfileUI(); show("menu-screen"); updatePlayerPosition(); }
})();

// ========= AUDIO =========
function toggleAudio(){
  audioOn = !audioOn; const sym = audioOn ? "🔊" : "🔈";
  ["#btn-audio-login","#btn-audio-top"].forEach(sel => { const b=$(sel); if(b) b.textContent=sym; });
  if(audioOn) play(snd.click);
}

// ========= RANK & AVATAR =========
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
function rankGlowShadow(points){
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

// ========= QUESTIONS =========
async function loadQuestions(){
  if(allQuestions.length) return allQuestions;
  const res = await fetch(QUESTION_FILE);
  const data = await res.json();
  allQuestions = data.map(q => ({
    question: supify(q.question),
    options: q.options.map(o => supify(o)),
    answer:  supify(q.answer),
    level:   q.level || "NB"
  }));
  return allQuestions;
}

// ========= MODES =========
async function startPractice(){
  play(snd.click); isArena=false; await loadQuestions();
  questions = shuffle([...allQuestions]).slice(0,10);
  beginQuiz();
}
async function startArena(){
  play(snd.click); isArena=true; await loadQuestions();
  questions = shuffle([...allQuestions]).slice(0,20);
  beginQuiz();
}
function beginQuiz(){
  idx=0; score=0; selectedAnswer=null; totalDuration=0;
  show("quiz-screen"); renderQuestion(); startTimer(); updateProgress();
}

// ========= RENDER =========
function renderQuestion(){
  const q = questions[idx];
  $("#questionBox").innerHTML = q.question;
  const ans = $("#answers"); ans.innerHTML = "";
  q.options.forEach(opt=>{
    const el = document.createElement("div");
    el.className="answer";
    el.innerHTML=opt;
    el.onclick = ()=> {
      play(snd.click);
      // toggle: nếu đang chọn -> bỏ chọn
      if(el.classList.contains("selected")){
        el.classList.remove("selected"); selectedAnswer=null; return;
      }
      // chọn mới
      document.querySelectorAll("#answers .answer").forEach(a=>a.classList.remove("selected"));
      el.classList.add("selected"); selectedAnswer=opt;
    };
    ans.appendChild(el);
  });
}

function updateProgress(){ $("#progressText").textContent = `Câu ${idx+1}/${questions.length}`; }

// ========= TIMER 59s =========
function startTimer(){
  clearInterval(timer);
  timeLeft=59; updateTimerUI();
  timer=setInterval(()=>{
    timeLeft--; totalDuration++;
    updateTimerUI();
    if(timeLeft<=0){ clearInterval(timer); play(snd.timeout); commitAnswer(null); }
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

// ========= NEXT =========
function nextQuestion(){
  if(selectedAnswer===null){ alert("Bạn chưa chọn đáp án!"); return; }
  commitAnswer(selectedAnswer);
}
function commitAnswer(ans){
  clearInterval(timer);
  const correct = questions[idx].answer;
  if(ans && ans===correct){ score++; play(snd.correct); }
  else if(ans){ play(snd.wrong); }
  idx++;
  if(idx<questions.length){
    selectedAnswer=null; renderQuestion(); startTimer(); updateProgress();
  }else{ finishQuiz(); }
}

// ========= FINISH =========
function finishQuiz(){
  clearInterval(timer);
  const total = questions.length;
  // điểm thang 10
  let score10 = (score/total*10);
  let lucky = false;

  if(isArena){
    // Lucky 1%: mở avatar hiếm + thưởng 20% điểm rank
    if(Math.random() < 0.01){ lucky=true; currentUser.avatar="rare.png"; }
    // cộng điểm rank theo số câu đúng
    let rankGain = score;
    if(lucky) rankGain = Math.round(rankGain*1.2);
    currentUser.points = (currentUser.points||0) + rankGain;
    // đổi avatar theo rank nếu chưa dính avatar hiếm
    if(!lucky){ currentUser.avatar = avatarByPoints(currentUser.points); }
    localStorage.setItem("toan8_profile", JSON.stringify(currentUser));
    updateProfileUI();
  }

  $("#resultText").innerHTML = `Bạn đúng <b>${score}</b>/<b>${total}</b> câu → <b>${score10.toFixed(1)}</b> điểm`;
  $("#luckyText").classList.toggle("hidden", !lucky);
  show("result-screen");

  if(isArena){
    play(snd.win);
    sendResult(score10.toFixed(1), totalDuration).then(()=>updatePlayerPosition());
  }
}

// ========= API =========
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
      av.src = guessAvatarFromScore(r.score);
      av.className="lb-avatar";
      const avTd=document.createElement("td"); avTd.appendChild(av);
      tr.innerHTML = `<td>${i+1}</td>`;
      tr.appendChild(avTd);
      tr.innerHTML += `<td>${r.name||r.fullname||""}</td><td>${r.class||r.clazz||""}</td><td>${r.nickname||""}</td><td>${r.score||""}</td>`;
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
      (r.name||r.fullname||"")===(currentUser?.name||"") &&
      (r.class||r.clazz||"")===(currentUser?.class||"") &&
      (r.nickname||"")===(currentUser?.nickname||"")
    ) + 1;
    $("#playerPos").textContent = pos>0 ? `#${pos} trên BXH` : `#– trên BXH`;
  }catch(e){ $("#playerPos").textContent = `#– trên BXH`; }
}

// avatar minh hoạ trên BXH theo điểm 1 trận
function guessAvatarFromScore(s){
  const score = Number(s||0);
  if(score>=9.5) return "gold.png";
  if(score>=8.0) return "silver.png";
  if(score>=6.5) return "bac.png";
  return "dong.png";
}

// ========= NAV =========
function showMenu(){ updateProfileUI(); show("menu-screen"); }

// ========= SỰ KIỆN =========
window.addEventListener("DOMContentLoaded", ()=>{
  $("#btn-start").addEventListener("click", login);
  $("#btn-logout").addEventListener("click", logout);
  $("#btn-audio-login").addEventListener("click", toggleAudio);
  $("#btn-audio-top").addEventListener("click", toggleAudio);

  $("#btn-practice").addEventListener("click", startPractice);
  $("#btn-arena").addEventListener("click", startArena);
  $("#btn-leaderboard").addEventListener("click", showLeaderboard);

  $("#btn-home").addEventListener("click", showMenu);
  $("#btn-back-menu").addEventListener("click", showMenu);
  $("#btn-lb-back").addEventListener("click", showMenu);
  $("#nextBtn").addEventListener("click", nextQuestion);
});
