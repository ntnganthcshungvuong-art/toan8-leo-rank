let currentQuestion = 0;
let timeLeft = 59;
let timerInterval;

function startTimer() {
  timeLeft = 59;
  document.getElementById("timer").innerText = `⏱ ${timeLeft}s`;
  const progress = document.getElementById("progress");
  progress.style.width = "100%";

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").innerText = `⏱ ${timeLeft}s`;
    progress.style.width = (timeLeft/59*100) + "%";

    if(timeLeft <= 0) {
      clearInterval(timerInterval);
      nextQuestion(); // auto chuyển
    }
  }, 1000);
}

function renderQuestion() {
  clearInterval(timerInterval);
  const q = questions[currentQuestion];
  document.getElementById("quiz-box").innerHTML = `
    <div class="card">
      <div class="timer" id="timer"></div>
      <div class="progress-bar" id="progress"></div>
      <h3>${q.question}</h3>
      ${q.options.map((opt,i)=>`
        <div class="choice" onclick="selectChoice(this, '${opt}')">${opt}</div>
      `).join('')}
    </div>
  `;
  startTimer();
}

function selectChoice(el, answer) {
  document.querySelectorAll(".choice").forEach(c=>c.classList.remove("selected"));
  el.classList.add("selected");
  userAnswers[currentQuestion] = answer;
}

function nextQuestion() {
  currentQuestion++;
  if(currentQuestion < questions.length) {
    renderQuestion();
  } else {
    finishQuiz();
  }
}
