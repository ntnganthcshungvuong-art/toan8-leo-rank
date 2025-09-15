const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec"; // dán link Google Apps Script /exec vào đây
let currentUser = null;
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let mode = "";

function login(){
  const fullname = document.getElementById('fullname').value.trim();
  const cls = document.getElementById('classSelect').value;
  const nickname = document.getElementById('nickname').value.trim();
  if(!fullname || !cls || !nickname){ alert("Nhập đầy đủ thông tin!"); return; }
  currentUser = { fullname, cls, nickname };
  document.getElementById("showName").textContent = nickname;
  showScreen("menu-screen");
}

function logout(){ currentUser=null; showScreen("login-screen"); }

function startQuiz(selectedMode){
  mode = selectedMode;
  score = 0;
  currentQuestionIndex = 0;
  fetch("questions.json")
    .then(r=>r.json())
    .then(data=>{
      questions = shuffle(data).slice(0,10); // chọn 10 câu
      showQuestion();
      showScreen("quiz-screen");
    });
}

function showQuestion(){
  const q = questions[currentQuestionIndex];
  const container = document.getElementById("question-container");
  container.innerHTML = `
    <div class="question-card">
      <h3>Câu ${currentQuestionIndex+1}: ${q.question}</h3>
      ${q.options.map(opt=>`
        <label class="option">
          <input type="radio" name="answer" value="${opt}"> ${opt}
        </label>`).join("")}
    </div>
  `;
  document.getElementById("next-btn").textContent = (currentQuestionIndex===questions.length-1)?"Nộp bài":"Câu tiếp";
}

function nextQuestion(){
  const ans = document.querySelector("input[name='answer']:checked");
  if(ans && ans.value === questions[currentQuestionIndex].answer) score++;
  currentQuestionIndex++;
  if(currentQuestionIndex<questions.length) showQuestion();
  else finishQuiz();
}

function finishQuiz(){
  let text="";
  if(mode==="arena"){
    text=`Bạn đúng ${score}/10. Điểm này sẽ được cộng vào tổng BXH.`;
    // gửi API
    fetch(API_URL,{method:"POST",body:JSON.stringify({
      action:"submit",
      name:currentUser.fullname,
      class:currentUser.cls,
      nickname:currentUser.nickname,
      score:score,
      duration:questions.length*30 // giả sử 30s/câu
    })});
  } else {
    if(score<=3) text=`Bạn đúng ${score}/10. Cố gắng thêm nhé! 💪`;
    else if(score<=7) text=`Bạn đúng ${score}/10. Khá tốt! 👍`;
    else text=`Xuất sắc! ${score}/10 🌟`;
  }
  document.getElementById("result-text").textContent = text;
  showScreen("result-screen");
}

function showLeaderboard(){
  fetch(API_URL+"?action=getRanking")
    .then(r=>r.json())
    .then(data=>{
      const body=document.querySelector("#leaderboard tbody");
      body.innerHTML="";
      data.forEach((row,i)=>{
        body.innerHTML+=`<tr><td>${i+1}</td><td>${row.name}</td><td>${row.class}</td><td>${row.score}</td><td>${calcRank(row.score)}</td></tr>`;
      });
      showScreen("leaderboard-screen");
    });
}

function calcRank(score){
  if(score<10) return "Đồng";
  if(score<20) return "Bạc";
  if(score<30) return "Vàng";
  if(score<40) return "Bạch Kim";
  if(score<50) return "Kim Cương";
  return "Cao Thủ";
}

function backToMenu(){ showScreen("menu-screen"); }

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a;}
