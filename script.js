const API_URL = "https://script.google.com/macros/s/AKfycbwyht9uRhyek_sQ0g-fNxr82TCY-AEEyFvgJkMwjmabSUGC3UW4I2X0KpuhlLF6NMJa/exec";

async function sendResult() {
  const data = {
    name: document.getElementById("name").value,
    class: document.getElementById("class").value,
    nickname: document.getElementById("nickname").value,
    score: document.getElementById("score").value,
    duration: "N/A"
  };
  try {
    let res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    });
    let json = await res.json();
    alert("Gửi thành công!");
  } catch (e) {
    alert("Lỗi khi gửi: " + e);
  }
}

async function getRanking() {
  try {
    let res = await fetch(API_URL + "?action=getRanking");
    let json = await res.json();
    let html = "<h2>Bảng xếp hạng Top 10</h2><ol>";
    json.forEach(item => {
      html += `<li>${item.nickname} (${item.class}) - ${item.score} điểm</li>`;
    });
    html += "</ol>";
    document.getElementById("leaderboard").innerHTML = html;
  } catch (e) {
    alert("Lỗi khi lấy BXH: " + e);
  }
}
