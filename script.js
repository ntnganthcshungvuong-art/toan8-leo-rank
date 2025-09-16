// === Cấu hình API (giữ nguyên link của bạn) ===
const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";

// === Hàm load câu hỏi ===
async function loadQuestions(set = "mix") {
    let file = "questions_mix13.json";  // mặc định trộn I + III
    if (set === "chap1") file = "questions_chap1.json";
    else if (set === "chap3") file = "questions_chap3.json";
    else if (set === "mix") file = "questions_mix13.json";

    try {
        const res = await fetch(file);
        const data = await res.json();
        return shuffleArray(data); // trộn ngẫu nhiên
    } catch (err) {
        console.error("❌ Lỗi load câu hỏi:", err);
        return [];
    }
}

// === Hàm bắt đầu đấu trường ===
async function startArena(set = "mix") {
    const allQuestions = await loadQuestions(set);
    currentQuestions = allQuestions.slice(0, 20); // 20 câu
    currentMode = "arena";
    currentScore = 0;
    currentIndex = 0;
    showQuestion();
    startTimer();
}

// === Hàm bắt đầu luyện tập ===
async function startPractice(set = "mix") {
    const allQuestions = await loadQuestions(set);
    currentQuestions = allQuestions.slice(0, 10); // 10 câu
    currentMode = "practice";
    currentScore = 0;
    currentIndex = 0;
    showQuestion();
    startTimer();
}

// === Hàm shuffle ngẫu nhiên ===
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

// === Các hàm khác giữ nguyên: showQuestion(), checkAnswer(), startTimer(), submitScore(), loadLeaderboard() ...
