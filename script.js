const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";

// Hàm load câu hỏi từ 2 chương
async function loadQuestions() {
  const chap1 = await fetch("questions_chap1.json").then(r => r.json());
  const chap3 = await fetch("questions_chap3.json").then(r => r.json());

  // gộp cả 2 chương
  let allQuestions = [...chap1, ...chap3];

  // xáo trộn và chọn 20 câu
  allQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 20);

  return allQuestions;
}
  // ghép 2 chương lại
}

// Hàm chọn ngẫu nhiên theo rank
function getQuestionsByRank(allQuestions, rank) {
  let ratio;
  switch (rank) {
    case "Đồng":   ratio = {NB:0.7, TH:0.3, VD:0, VDC:0}; break;
    case "Bạc":    ratio = {NB:0.6, TH:0.4, VD:0, VDC:0}; break;
    case "Vàng":   ratio = {NB:0.5, TH:0.4, VD:0.1, VDC:0}; break;
    case "Kim cương": ratio = {NB:0.4, TH:0.4, VD:0.2, VDC:0}; break;
    case "Tinh anh":  ratio = {NB:0.3, TH:0.4, VD:0.2, VDC:0.1}; break;
    case "Cao thủ":   ratio = {NB:0.2, TH:0.3, VD:0.2, VDC:0.3}; break;
    default: ratio = {NB:0.5, TH:0.3, VD:0.2, VDC:0};
  }

  const pick = (arr, n) => arr.sort(() => 0.5 - Math.random()).slice(0, n);
  const nb = pick(allQuestions.filter(q => q.level==="NB"), Math.round(20*ratio.NB));
  const th = pick(allQuestions.filter(q => q.level==="TH"), Math.round(20*ratio.TH));
  const vd = pick(allQuestions.filter(q => q.level==="VD"), Math.round(20*ratio.VD));
  const vdc = pick(allQuestions.filter(q => q.level==="VDC"), Math.round(20*ratio.VDC));
  return [...nb, ...th, ...vd, ...vdc].sort(() => 0.5 - Math.random());
}

// Gửi điểm lên API
async function sendScore(data) {
  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {"Content-Type": "application/json"}
  });
}

// Lấy BXH
async function getRanking() {
  const res = await fetch(`${API_URL}?action=getRanking`);
  return await res.json();
}
