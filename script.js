
// =============== CONFIG ===============
const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";
const PRACTICE_COUNT = 10;
const ARENA_COUNT = 20;
const PER_QUESTION_SEC = 59;

// =============== STATE ===============
let currentUser = null;
let pool = [];           // questions_mix13.json
let questions = [];
let idx = 0;
let score = 0;
let mode = "";           // 'practice' | 'arena'
let timer = null;
let remain = PER_QUESTION_SEC;
let answered = false;

// Sounds
const sfxClick   = () => document.getElementById('sfx-click')?.play();
const sfxRight   = () => document.getElementById('sfx-right')?.play();
const sfxWrong   = () => document.getElementById('sfx-wrong')?.play();
const sfxTimeout = () => document.getElementById('sfx-timeout')?.play();
const sfxWin     = () => document.getElementById('sfx-win')?.play();

// =============== UTIL ===============
const $ = (sel)=>document.querySelector(sel);
const shuffle = arr => arr.sort(()=>Math.random()-0.5);
const pick = (arr,n)=> shuffle(arr.slice()).slice(0,n);

function saveProfile(){
  localStorage.setItem("fullname", $("#fullname").value.trim());
  localStorage.setItem("className", $("#className").value);
  localStorage.setItem("nickname", $("#nickname").value.trim());
}
function loadProfileInputs(){
  if ($("#fullname")) $("#fullname").value = localStorage.getItem("fullname") || "";
  if ($("#className")) $("#className").value = localStorage.getItem("className") || "";
  if ($("#nickname")) $("#nickname").value = localStorage.getItem("nickname") || "";
}
function bindTopProfile(){
  const fn = localStorage.getItem("fullname")||"";
  const cl = localStorage.getItem("className")||"";
  const nk = localStorage.getItem("nickname")||"";
  const name = (fn && nk) ? `${fn} (${cl}) · ${nk}` : "";
  $("#player-name").textContent = name;
}

function logout(){
  localStorage.removeItem("fullname");
  localStorage.removeItem("className");
  localStorage.removeItem("nickname");
  backToLogin();
}

function backToLogin(){
  showScreen("login-screen");
  $("#menu-screen").classList.remove("active");
}

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// =============== LOGIN ===============
function login(){
  const fullname = $("#fullname").value.trim();
  const className = $("#className").value;
  const nickname = $("#nickname").value.trim();
  if (!fullname || !className || !nickname) {
    alert("Vui lòng nhập Họ tên, chọn lớp và nhập Biệt danh!");
    return;
  }
  currentUser = { fullname, className, nickname };
  saveProfile();
  bindTopProfile();
  showScreen("menu-screen");
}

// =============== LOAD QUESTIONS ===============
async function loadPool(){
  if (pool.length) return;
  const res = await fetch("questions_mix13.json");
  pool = await res.json();
}

// =============== START MODES ===============
async function startPractice(){
  sfxClick();
  await ensureProfile();
  await loadPool();
  mode = 'practice';
  questions = pick(pool, PRACTICE_COUNT);
  idx = 0; score = 0;
  showScreen("quiz-screen");
  renderQuestion();
  startTimer();
}

async function startArena(){
  sfxClick();
  await ensureProfile();
  await loadPool();
  mode = 'arena';
  questions = pick(pool, ARENA_COUNT);
  idx = 0; score = 0;
  showScreen("quiz-screen");
  renderQuestion();
  startTimer();
}

async function ensureProfile(){
  const fn = localStorage.getItem("fullname");
  const cl = localStorage.getItem("className");
  const nk = localStorage.getItem("nickname");
  if (!fn || !cl || !nk) {
    saveProfile();
    if (!localStorage.getItem("fullname") || !localStorage.getItem("className") || !localStorage.getItem("nickname")){
      alert("Vui lòng nhập đủ Họ tên - Lớp - Nickname.");
      throw new Error("missing profile");
    }
  }
}

// =============== TIMER ===============
function startTimer(){
  remain = PER_QUESTION_SEC;
  updateTimerUI();
  clearInterval(timer);
  timer = setInterval(()=>{
    remain--;
    updateTimerUI();
    if (remain<=0){
      clearInterval(timer);
      sfxTimeout();
      answered = true;
      $('#nextBtn').disabled = false;
    }
  }, 1000);
}
function updateTimerUI(){
  $("#timerText").textContent = `${remain}s`;
  $("#timerBar").style.width = `${(remain/PER_QUESTION_SEC)*100}%`;
}

// =============== RENDER Q/A ===============
function renderQuestion(){
  const q = questions[idx];
  answered = false;
  $('#nextBtn').disabled = true;
  $("#questionBox").innerHTML = `Câu ${idx+1}/${questions.length}: ${q.question}`;
  $("#optionsBox").innerHTML = q.options.map((opt,i)=>`<button class="option" onclick="choose(${i}, this)">${opt}</button>`).join("");
  clearInterval(timer);
  startTimer();
}

function choose(i, btn){
  if (answered) return;
  sfxClick();
  answered = true;
  [...document.querySelectorAll(".option")].forEach(b=>b.classList.remove("selected"));
  btn.classList.add("selected");
  const q = questions[idx];
  const ok = (q.options[i] === q.answer);
  if (ok){ score++; sfxRight(); } else { sfxWrong(); }
  $('#nextBtn').disabled = false;
}

// =============== FLOW ===============
function nextQuestion(){
  if (!answered) return;
  idx++;
  if (idx>=questions.length) return finishQuiz();
  renderQuestion();
}

function finishQuiz(){
  clearInterval(timer);
  const point10 = (score / questions.length * 10).toFixed(1);
  $("#resultText").textContent = (mode==='practice')
    ? `Bạn đúng ${score}/${questions.length}. Điểm tham khảo: ${point10}/10. Tiếp tục luyện nhé!`
    : `Bạn đúng ${score}/${questions.length}. Điểm đấu trường: ${point10}/10.`;

  const lucky = $("#luckyBox");
  lucky.classList.add("hidden");
  if (mode==='arena' && Math.random()<0.01){
    lucky.textContent = "🎉 LUCKY EVENT: Avatar hiếm hoặc gói x2 điểm!";
    lucky.classList.remove("hidden");
  }
  $("#resultModal").classList.remove("hidden");
  sfxWin();

  if (mode==='arena'){
    const body = {
      name: localStorage.getItem("fullname") || "NA",
      class: localStorage.getItem("className") || "8A?",
      nickname: localStorage.getItem("nickname") || "Guest",
      score: point10,
      duration: `${questions.length}c-${PER_QUESTION_SEC}s`
    };
    fetch(API_URL, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) }).catch(()=>{});
  }
}

function backHome(){
  $("#resultModal").classList.add("hidden");
  showScreen("menu-screen");
}

// =============== RANKING ===============
async function showRanking(){
  try{
    const res = await fetch(API_URL + "?action=getRanking");
    const data = await res.json();
    const box = $("#ranking");
    if (!Array.isArray(data) || !data.length){ box.innerHTML = "<p>Chưa có dữ liệu BXH.</p>"; return; }
    box.innerHTML = `
      <table>
        <thead><tr><th>Hạng</th><th>Nickname</th><th>Lớp</th><th>Điểm</th><th>Thời gian</th></tr></thead>
        <tbody>
          ${data.slice(0,10).map((r,i)=>`
            <tr>
              <td>${i+1}</td>
              <td>${r.nickname||""}</td>
              <td>${r.class||""}</td>
              <td>${r.score||""}</td>
              <td>${r.duration||""}</td>
            </tr>`).join("")}
        </tbody>
      </table>`;
  }catch(e){ $("#ranking").innerHTML = "<p>Lỗi tải BXH</p>"; }
}

// INIT
document.addEventListener("DOMContentLoaded", ()=>{
  loadProfileInputs();
  bindTopProfile();
});
