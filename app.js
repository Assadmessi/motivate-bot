const nameInput = document.getElementById("nameInput");
const moodSelect = document.getElementById("moodSelect");
const getBtn = document.getElementById("getBtn");
const resetBtn = document.getElementById("resetBtn");
const messageOutput = document.getElementById("messageOutput");

const messages = {
  happy: ["Keep shining — today is yours!", "Your energy is contagious. Spread it!"],
  sad: ["It’s okay to feel sad. You’re not alone.", "Small steps are still progress. Breathe."],
  tired: ["Rest if you need — then come back stronger.", "Even slow progress is progress."],
  stress: ["Take a deep breath. You’ve got this.", "One step at a time. You’re handling it."]
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
  return true;
}

getBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const mood = moodSelect.value;

  if (!validate(name, mood)) return;

  const picked = getRandomItem(messages[mood]);
  const moodMeta = {
  happy: { emoji: "😊", title: "Happy mode" },
  sad: { emoji: "🌧️", title: "Gentle mode" },
  tired: { emoji: "😴", title: "Recharge mode" },
  stressed: { emoji: "😵‍💫", title: "Calm mode" }
  };

    const { emoji, title } = moodMeta[mood] || { emoji: "💬", title: "Motivation" };
    messageOutput.classList.add("is-updating");

    setTimeout(() => {
    messageOutput.innerText = `${emoji} ${title}: ${name}, ${picked}`;
    messageOutput.classList.remove("is-updating");
    }, 120);
 });

 
resetBtn.addEventListener("click", () => {
  nameInput.value = "";
  moodSelect.value = "";
  messageOutput.innerText = "Your message will appear here…";
});