const nameInput = document.getElementById("nameInput");
const moodSelect = document.getElementById("moodSelect");
const getBtn = document.getElementById("getBtn");
const resetBtn = document.getElementById("resetBtn");
const messageOutput = document.getElementById("messageOutput");

// ✅ Your deployed Worker API
const API_URL = "https://motivate-bot.ayehtetheinmessi.workers.dev/api/motivate";

// Emoji + titles (kept)
const moodMeta = {
  happy: { emoji: "😊", title: "Happy mode" },
  sad: { emoji: "🌧️", title: "Gentle mode" },
  tired: { emoji: "😴", title: "Recharge mode" },
  stressed: { emoji: "😵‍💫", title: "Calm mode" },
};

// (Optional) fallback messages if AI fails (kept as backup)
const fallbackMessages = {
  happy: ["Keep shining — today is yours!", "Your energy is contagious. Spread it!"],
  sad: ["It’s okay to feel sad. You’re not alone.", "Small steps are still progress. Breathe."],
  tired: ["Rest if you need — then come back stronger.", "Even slow progress is progress."],
  stressed: ["Take a deep breath. You’ve got this.", "One step at a time. You’re handling it."],
};

function getRandomItem(arr) {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

function validate(name, mood) {
  if (!name) {
    messageOutput.innerText = "Please enter your name.";
    return false;
  }
  if (!mood) {
    messageOutput.innerText = "Please select a mood.";
    return false;
  }
  if (!moodMeta[mood]) {
    messageOutput.innerText = "Please select a valid mood.";
    return false;
  }
  return true;
}

async function fetchAIMotivation(name, mood) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mood }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Daily cap / quota reached
    if (res.status === 429) {
      throw new Error("AI limit reached for today. Try again tomorrow.");
    }
    throw new Error(data.error || "Something went wrong.");
  }

  return data.message;
}

function renderMessage({ name, mood, text }) {
  const { emoji, title } = moodMeta[mood] || { emoji: "💬", title: "Motivation" };

  messageOutput.classList.add("is-updating");
  setTimeout(() => {
    messageOutput.innerText = `${emoji} ${title}: ${name}, ${text}`;
    messageOutput.classList.remove("is-updating");
  }, 120);
}

getBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const mood = moodSelect.value.trim().toLowerCase(); // ✅ prevents "Happy" bug

  if (!validate(name, mood)) return;

  renderMessage({ name, mood, text: "Thinking..." });

  try {
    const aiText = await fetchAIMotivation(name, mood);
    renderMessage({ name, mood, text: aiText });
  } catch (err) {
    // fallback if AI fails (optional but professional)
    const fallback = getRandomItem(fallbackMessages[mood] || ["Keep going — you’ve got this."]);
    renderMessage({ name, mood, text: `${err.message} (${fallback})` });
  }
});

resetBtn.addEventListener("click", () => {
  nameInput.value = "";
  moodSelect.value = "";
  messageOutput.innerText = "Your message will appear here…";
});

// Optional nice touch
nameInput.focus();