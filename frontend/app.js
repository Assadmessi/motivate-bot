const nameInput = document.getElementById("nameInput");
const moodSelect = document.getElementById("moodSelect");
const getBtn = document.getElementById("getBtn");
const resetBtn = document.getElementById("resetBtn");
const messageOutput = document.getElementById("messageOutput");
const languageSelect = document.getElementById("languageSelect");

// ✅ Your deployed Worker API
const API_URL = "https://motivate-bot.ayehtetheinmessi.workers.dev/api/motivate";

const translations = {
  en: {
    lang: "en",
    appTitle: "Daily Motivation Bot",
    languageLabel: "Language",
    nameLabel: "Your name",
    namePlaceholder: "Enter your name",
    moodLabel: "Your mood",
    moodPlaceholder: "Select mood...",
    moodSad: "Sad",
    moodHappy: "Happy",
    moodTired: "Tired",
    moodStressed: "Stressed",
    getBtn: "Get Motivation",
    resetBtn: "Reset",
    botSaysTitle: "Bot says:",
    defaultMessage: "Your message will appear here…",
    enterName: "Please enter your name.",
    selectMood: "Please select a mood.",
    validMood: "Please select a valid mood.",
    thinking: "Thinking...",
    aiLimit: "AI limit reached for today. Try again tomorrow.",
    somethingWrong: "Something went wrong.",
    motivationTitle: "Motivation",
    formattedMessage: ({ emoji, title, name, text }) => `${emoji} ${title}: ${name}, ${text}`,
  },
  my: {
    lang: "my",
    appTitle: "နေ့စဉ် စိတ်ခွန်အားပေး ဘော့",
    languageLabel: "ဘာသာစကား",
    nameLabel: "သင့်နာမည်",
    namePlaceholder: "သင့်နာမည်ရေးပါ",
    moodLabel: "သင့်စိတ်အခြေအနေ",
    moodPlaceholder: "စိတ်အခြေအနေ ရွေးပါ...",
    moodSad: "ဝမ်းနည်း",
    moodHappy: "ပျော်ရွှင်",
    moodTired: "ပင်ပန်း",
    moodStressed: "စိတ်ဖိစီး",
    getBtn: "စိတ်ခွန်အားယူမယ်",
    resetBtn: "ပြန်ရှင်းမယ်",
    botSaysTitle: "ဘော့က ပြောတာ:",
    defaultMessage: "မက်ဆေ့ချ်ကို ဒီနေရာမှာ ပြပါလိမ့်မယ်…",
    enterName: "ကျေးဇူးပြု၍ သင့်နာမည် ရိုက်ထည့်ပါ။",
    selectMood: "ကျေးဇူးပြု၍ စိတ်အခြေအနေ ရွေးပါ။",
    validMood: "ကျေးဇူးပြု၍ မှန်ကန်သော စိတ်အခြေအနေကို ရွေးပါ။",
    thinking: "စဉ်းစားနေပါတယ်...",
    aiLimit: "ယနေ့အတွက် AI အသုံးပြုမှုကန့်သတ်ချက် ပြည့်သွားပါပြီ။ မနက်ဖြန် ပြန်ကြိုးစားပါ။",
    somethingWrong: "တစ်ခုခု မှားယွင်းနေပါတယ်။",
    motivationTitle: "စိတ်ခွန်အား",
    formattedMessage: ({ emoji, title, name, text }) => `${emoji} ${title}: ${name} ရေ ${text}`,
  },
};

let currentLanguage = "en";

// Emoji + titles
const moodMeta = {
  happy: {
    emoji: "😊",
    title: { en: "Happy mode", my: "ပျော်ရွှင်မှု မုဒ်" },
  },
  sad: {
    emoji: "🌧️",
    title: { en: "Gentle mode", my: "နူးညံ့အားပေး မုဒ်" },
  },
  tired: {
    emoji: "😴",
    title: { en: "Recharge mode", my: "အားပြန်ဖြည့် မုဒ်" },
  },
  stressed: {
    emoji: "😵‍💫",
    title: { en: "Calm mode", my: "စိတ်အေးချမ်း မုဒ်" },
  },
};

// fallback messages if AI fails
const fallbackMessages = {
  happy: {
    en: ["Keep shining — today is yours!", "Your energy is contagious. Spread it!"],
    my: ["ဒီအရှိန်ကောင်းကို ဆက်ထိန်းထား၊ မင်းလုပ်နေသမျှက တကယ် အဓိပ္ပာယ်ရှိနေတယ်။", "ဒီနေ့စိတ်ကောင်းနေတာကို အားဖြစ်အောင်ယူပြီး ဆက်သွား၊ မင်းသွားနေတဲ့လမ်းက တကယ်ကောင်းတဲ့ဘက်ကို ရောက်နေတယ်။"],
  },
  sad: {
    en: ["It’s okay to feel sad. You’re not alone.", "Small steps are still progress. Breathe."],
    my: ["အခုလိုစိတ်ကျနေလည်း အားလုံးပြီးသွားတာမဟုတ်ဘူး၊ ခဏနားပြီး ဖြည်းဖြည်းပြန်စလို့ရတယ်။", "ဒီနေ့ခက်နေရင်တောင် မင်းမရှုံးသေးဘူး၊ တစ်လှမ်းချင်းပြန်ထဖို့ အားက မင်းဆီမှာ ရှိသေးတယ်။"],
  },
  tired: {
    en: ["Rest if you need — then come back stronger.", "Even slow progress is progress."],
    my: ["ပင်ပန်းနေရင် ခဏနားတာ မမှားဘူး၊ အားပြန်စုလိုက်ပြီး ဖြည်းဖြည်းဆက်သွားရင်လည်း ရောက်တယ်။", "ဒီနေ့နှေးနေလည်း ပြဿနာမရှိဘူး၊ မင်းမရပ်သရွေ့ နည်းနည်းချင်းတော့ ရှေ့ကို သွားနေတုန်းပဲ။"],
  },
  stressed: {
    en: ["Take a deep breath. You’ve got this.", "One step at a time. You’re handling it."],
    my: ["အကုန်တစ်ခါတည်းမကိုင်တွယ်လို့ရလည်း မလိုဘူး၊ တစ်ခုချင်း ဖြည်းဖြည်းလုပ်သွားရင် ပြေလည်သွားမယ်။", "စိတ်ဖိစီးနေတာက မင်းမတော်လို့မဟုတ်ဘူး၊ အခုဝန်တွေများနေလို့ပဲ ဖြစ်တာဆိုတော့ ဖြည်းဖြည်းရှင်းသွားရင် ရတယ်။"],
  },
};

function t(key) {
  return translations[currentLanguage][key] || translations.en[key] || "";
}

function getRandomItem(arr) {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

function applyTranslations() {
  document.documentElement.lang = translations[currentLanguage].lang;
  document.getElementById("appTitle").innerText = t("appTitle");
  document.getElementById("languageLabel").innerText = t("languageLabel");
  document.getElementById("nameLabel").innerText = t("nameLabel");
  document.getElementById("moodLabel").innerText = t("moodLabel");
  document.getElementById("moodPlaceholder").innerText = t("moodPlaceholder");
  document.querySelector('[data-i18n="moodSad"]').innerText = t("moodSad");
  document.querySelector('[data-i18n="moodHappy"]').innerText = t("moodHappy");
  document.querySelector('[data-i18n="moodTired"]').innerText = t("moodTired");
  document.querySelector('[data-i18n="moodStressed"]').innerText = t("moodStressed");
  document.getElementById("botSaysTitle").innerText = t("botSaysTitle");
  getBtn.innerText = t("getBtn");
  resetBtn.innerText = t("resetBtn");
  nameInput.placeholder = t("namePlaceholder");

  if (!messageOutput.dataset.hasCustomMessage) {
    messageOutput.innerText = t("defaultMessage");
  }
}

function validate(name, mood) {
  if (!name) {
    messageOutput.innerText = t("enterName");
    messageOutput.dataset.hasCustomMessage = "true";
    return false;
  }
  if (!mood) {
    messageOutput.innerText = t("selectMood");
    messageOutput.dataset.hasCustomMessage = "true";
    return false;
  }
  if (!moodMeta[mood]) {
    messageOutput.innerText = t("validMood");
    messageOutput.dataset.hasCustomMessage = "true";
    return false;
  }
  return true;
}

async function fetchAIMotivation(name, mood) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mood, language: currentLanguage }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error(t("aiLimit"));
    }
    throw new Error(data.error || t("somethingWrong"));
  }

  return data.message;
}

function renderMessage({ name, mood, text }) {
  const meta = moodMeta[mood] || { emoji: "💬", title: { en: t("motivationTitle"), my: t("motivationTitle") } };
  const title = meta.title[currentLanguage] || meta.title.en;

  messageOutput.classList.add("is-updating");
  setTimeout(() => {
    messageOutput.innerText = t("formattedMessage")({
      emoji: meta.emoji,
      title,
      name,
      text,
    });
    messageOutput.dataset.hasCustomMessage = "true";
    messageOutput.classList.remove("is-updating");
  }, 120);
}

getBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const mood = moodSelect.value.trim().toLowerCase();

  if (!validate(name, mood)) return;

  renderMessage({ name, mood, text: t("thinking") });

  try {
    const aiText = await fetchAIMotivation(name, mood);
    renderMessage({ name, mood, text: aiText });
  } catch (err) {
    const fallback = getRandomItem((fallbackMessages[mood] && fallbackMessages[mood][currentLanguage]) || ["Keep going — you’ve got this."]);
    renderMessage({ name, mood, text: `${err.message} (${fallback})` });
  }
});

resetBtn.addEventListener("click", () => {
  nameInput.value = "";
  moodSelect.value = "";
  messageOutput.innerText = t("defaultMessage");
  delete messageOutput.dataset.hasCustomMessage;
});

languageSelect.addEventListener("change", (event) => {
  currentLanguage = event.target.value === "my" ? "my" : "en";
  applyTranslations();
});

applyTranslations();
nameInput.focus();
