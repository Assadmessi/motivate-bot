function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors() },
  });
}

const DAILY_REQUEST_CAP = 300;

async function checkDailyCap() {
  const today = new Date().toISOString().slice(0, 10);
  const key = new Request(`https://cap.local/${today}`);

  const cache = caches.default;
  const cached = await cache.match(key);
  const count = cached ? Number(await cached.text()) : 0;

  if (count >= DAILY_REQUEST_CAP) return { ok: false, count };

  const next = count + 1;
  await cache.put(key, new Response(String(next), { headers: { "Cache-Control": "max-age=86400" } }));
  return { ok: true, count: next };
}


function buildMessages({ name, mood, language, moodLabels }) {
  const moodGuide = {
    happy: {
      en: "Match the user's happy mood. Sound warm, confident, and uplifting without being cheesy.",
      my: "အသုံးပြုသူက ပျော်ရွှင်နေပါတယ်။ သူငယ်ချင်းတစ်ယောက်က တကယ်ဝမ်းသာပေးပြီး အားပေးသလို ပေါ့ပါးနွေးထွေးတဲ့အသံနဲ့ ရေးပါ။ ချီးမွမ်းလွန်ကဲတာ၊ စကားကြီးစကားကျယ်ဖြစ်တာ မလုပ်ပါနဲ့။",
    },
    sad: {
      en: "Match the user's sad mood. Start with empathy, then gently encourage. Do not sound overly excited.",
      my: "အသုံးပြုသူက ဝမ်းနည်းနေပါတယ်။ သူငယ်ချင်းတစ်ယောက်က နားလည်ပေးသလို အရင်ပျော့ပျော့ပြောပြီး တဖြည်းဖြည်း အားပေးပါ။ အလွန်တက်ကြွတဲ့အသံ၊ ပျော်ဖို့အတင်းဖိအားပေးသလိုအသံ မဖြစ်စေပါနဲ့။",
    },
    tired: {
      en: "Match the user's tired mood. Sound calm, soft, and practical. Encourage rest and steady progress.",
      my: "အသုံးပြုသူက ပင်ပန်းနေပါတယ်။ သူငယ်ချင်းတစ်ယောက်က အေးအေးဆေးဆေး ပြောသလို နူးညံ့ပြီး လက်တွေ့ကျအောင် ရေးပါ။ နားခိုဖို့၊ အားပြန်ဖြည့်ဖို့၊ ဖြည်းဖြည်းဆက်သွားဖို့ အားပေးပါ။",
    },
    stressed: {
      en: "Match the user's stressed mood. Sound reassuring, grounded, and calming. Avoid pressure.",
      my: "အသုံးပြုသူက စိတ်ဖိစီးနေပါတယ်။ သူငယ်ချင်းတစ်ယောက်က ဘေးမှာရှိပြီး စိတ်ချမ်းသာအောင် ပြောသလို ငြိမ်ငြိမ်သက်သက်နဲ့ ယုံကြည်မှုရစေတဲ့အသံနဲ့ ရေးပါ။ ဖိအားပေးတာ၊ အမိန့်ပေးသလိုဖြစ်တာ မလုပ်ပါနဲ့။",
    },
  };

  const myanmarExamples = {
    happy: [
      "ဒီအရှိန်ကောင်းကို ဆက်ထိန်းထား၊ မင်းလုပ်နေသမျှက တကယ် အဓိပ္ပာယ်ရှိနေတယ်။",
      "ဒီနေ့စိတ်ကောင်းနေတာကို အားဖြစ်အောင်ယူပြီး ဆက်သွား၊ မင်းသွားနေတဲ့လမ်းက တကယ်ကောင်းတဲ့ဘက်ကို ရောက်နေတယ်။",
    ],
    sad: [
      "အခုလိုစိတ်ကျနေလည်း အားလုံးပြီးသွားတာမဟုတ်ဘူး၊ ခဏနားပြီး ဖြည်းဖြည်းပြန်စလို့ရတယ်။",
      "ဒီနေ့ခက်နေရင်တောင် မင်းမရှုံးသေးဘူး၊ တစ်လှမ်းချင်းပြန်ထဖို့ အားက မင်းဆီမှာ ရှိသေးတယ်။",
    ],
    tired: [
      "ပင်ပန်းနေရင် ခဏနားတာ မမှားဘူး၊ အားပြန်စုလိုက်ပြီး ဖြည်းဖြည်းဆက်သွားရင်လည်း ရောက်တယ်။",
      "ဒီနေ့နှေးနေလည်း ပြဿနာမရှိဘူး၊ မင်းမရပ်သရွေ့ နည်းနည်းချင်းတော့ ရှေ့ကို သွားနေတုန်းပဲ။",
    ],
    stressed: [
      "အကုန်တစ်ခါတည်းမကိုင်တွယ်လို့ရလည်း မလိုဘူး၊ တစ်ခုချင်း ဖြည်းဖြည်းလုပ်သွားရင် ပြေလည်သွားမယ်။",
      "စိတ်ဖိစီးနေတာက မင်းမတော်လို့မဟုတ်ဘူး၊ အခုဝန်တွေများနေလို့ပဲ ဖြစ်တာဆိုတော့ ဖြည်းဖြည်းရှင်းသွားရင် ရတယ်။",
    ],
  };

  if (language === "my") {
    return [
      {
        role: "system",
        content:
          "သင်ဟာ မြန်မာဘာသာနဲ့ သဘာဝကျကျ စကားပြောတတ်တဲ့ motivation assistant တစ်ယောက်ပါ။ " +
          "အသုံးပြုသူရဲ့ mood ကို တိတိကျကျလိုက်ဖက်အောင် ပြန်ရေးရမယ်။ " +
          "အင်္ဂလိပ် motivation message က ပေးတဲ့ feeling နဲ့ အားပေးသံကို မြန်မာလို သဘာဝကျကျ ထုတ်ပေးရမယ်။ " +
          "အောက်မှာပေးထားတဲ့ မြန်မာဥပမာတွေလို flow၊ အသံ၊ sentence building ကို နမူနာယူပါ။ ဒီ style နဲ့နီးနီးရေးပါ။ " +
          "မြန်မာစာကို သူငယ်ချင်းတစ်ယောက်က တကယ်ပြောသလို ချောချောမွေ့မွေ့ ရေးပါ။ ဘာသာပြန်နံ့၊ AI နံ့၊ စာအုပ်ဆန်တဲ့ ပုံစံ မထွက်စေပါနဲ့။ " +
          "ဝါကျတည်ဆောက်ပုံက ရိုးရိုးရှင်းရှင်း၊ နွေးနွေးထွေးထွေး၊ ဖတ်လိုက်တာနဲ့ အဓိပ္ပာယ်တန်းဝင်ရမယ်။ မသုံးနေကျ စကားလုံး၊ ကြမ်းတမ်းတဲ့ စကား၊ တရားဟောသလို tone မသုံးပါနဲ့။ " +
          "မင်း၊ ဒီနေ့၊ အခု၊ ခဏနား၊ ဖြည်းဖြည်း၊ ဆက်သွားလို ရိုးရိုးသဘာဝ စကားလုံးတွေကို ပိုသုံးနိုင်တယ်။ သင်၊ သင့်၊ အောင်မြင်မှု၊ ယုံကြည်ပါ၊ ကြိုးစားပါလို စာအုပ်ဆန်တဲ့ အသုံးအနှုန်းတွေကို မသုံးပါနဲ့။ UI က နာမည်ကို အလိုအလျောက်ထည့်ပြီးသားဖြစ်လို့ နာမည်ကို လုံးဝ မထည့်ပါနဲ့။ နှုတ်ဆက်စကားနဲ့ မစပါနဲ့။ " +
          "အင်္ဂလိပ်စာ၊ markdown၊ bullet point၊ quote၊ emoji မသုံးပါနဲ့။ " +
          "စာကြောင်းတစ်ကြောင်းတည်း သို့မဟုတ် ပြီးပြည့်စုံတဲ့ စာကြောင်း ၂ ကြောင်းပဲ ရေးပါ။ ဝါကျတစ်ခုချင်းစီက အဆုံးသတ်ပြည့်စုံရမယ်။ စကားလက်စမကျန်ရဘူး။ " +
          "ပထမစာကြောင်းက နားလည်ပေးသလို သို့မဟုတ် လိုက်ဖက်တဲ့ mood ကို ထိစေပြီး၊ နောက်စာကြောင်းရှိရင် ဖြည်းဖြည်းအားပေးတဲ့ပုံစံနဲ့ အဆုံးသတ်ပါ။ " +
          "အဓိကက အောက်က ဥပမာတွေရဲ့ mood flow နဲ့ နီးရမယ်။ weird flow၊ translated flow၊ formal ဆန်တဲ့ flow မဖြစ်ရပါ။",
      },
      {
        role: "user",
        content:
          `နာမည် - ${name}\n` +
          `စိတ်အခြေအနေ - ${moodLabels.my[mood]}\n` +
          `${moodGuide[mood]?.my || ""}\n` +
          `ဒီ mood အတွက် သဘာဝကျတဲ့ ဥပမာ style ၂ ခု -\n${myanmarExamples[mood].map((x, i) => `${i + 1}. ${x}`).join("\n")}\n` +
          "အပေါ်ကဥပမာတွေကို စာလုံးတိတိမကူးဘဲ mood flow တူ၊ အားပေးသံတူ၊ sentence building တူတဲ့ မြန်မာ motivation message အသစ်တစ်ခု ရေးပါ။ သူငယ်ချင်းတစ်ယောက်က ရိုးရိုးပြောသလို ဖြစ်ရမယ်။ ဖတ်ရခက်တဲ့ စကားလုံး၊ formal ဆန်တဲ့ အသုံးအနှုန်း၊ ဘာသာပြန်နံ့ထွက်တဲ့ ဝါကျပုံစံ မသုံးပါနဲ့။ flow မကွာသွားပါနဲ့။ စာကို တိတိကျကျ အဆုံးသတ်ပြီး နောက်ဆုံးမှာ ။ ပါစေ။",
      },
    ];
  }

  return [
    {
      role: "system",
      content:
        "You are a natural, emotionally-aware motivation assistant. Match the user's mood closely. " +
        "Write like a real person, not like a translation or generic quote generator. " +
        "Do not include the user's name because the UI already adds it. " +
        "Keep it short: 1-2 sentences, no markdown, no bullet points, no quotes, no emojis.",
    },
    {
      role: "user",
      content:
        `Name: ${name}\nMood: ${moodLabels.en[mood]}\n` +
        `${moodGuide[mood]?.en || ""}\n` +
        "Write one short, kind, practical motivational message that fits this mood.",
    },
  ];
}


function trimToCompleteMyanmarSentences(message) {
  const text = String(message || "").trim();
  if (!text) return "";

  const complete = text.match(/[^။!?]+[။!?]/g) || [];
  if (complete.length) {
    return complete
      .slice(0, 2)
      .map((part) => part.trim())
      .join(" ")
      .trim();
  }

  if (/[က-႟)]$/.test(text) && !/[၊,:;\-–—…]$/.test(text)) {
    return `${text}။`;
  }

  return text;
}

function looksIncompleteMyanmarMessage(message) {
  const text = String(message || "").trim();
  if (!text) return true;

  if (/[…]|[၊,:;\-–—]$/.test(text)) return true;

  const incompleteEndings = [
    "ပြီး",
    "လို့",
    "ဆိုတော့",
    "ဒါပေမယ့်",
    "ပေမယ့်",
    "မဟုတ်ဘဲ",
    "ဖြစ်ပြီး",
    "ဖြစ်တာ",
    "လုပ်ပြီး",
    "နေလို့",
    "နေတဲ့",
    "နေတုန်း",
    "တဲ့",
    "သော",
  ];

  if (incompleteEndings.some((ending) => text.endsWith(ending))) return true;

  const completeSentenceCount = (text.match(/[။!?]/g) || []).length;
  if (completeSentenceCount === 0 && text.length < 20) return true;

  return false;
}

function cleanMyanmarMessage(message) {
  return message
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/["“”‘’]/g, "")
    .replace(/^[\-–—•*\d.\s]+/, "")
    .replace(/\s+([၊။!?])/g, "$1")
    .replace(/([၊။!?])(\S)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .replace(/^(ဟယ်လို|မင်္ဂလာပါ|ဟိုင်း)[၊,]?\s*/i, "")
    .replace(/^(?:[\u1000-\u109F]{1,12}|[A-Za-z]{1,20})\s*ရေ[၊,]?\s*/u, "")
    .replace(/^(စိတ်အခြေအနေ|မက်ဆေ့ချ်)\s*[:：]\s*/u, "")
    .trim();
}

function isWeakMyanmarMessage(message) {
  if (!message) return true;
  const text = String(message).trim();
  const myanmarChars = (text.match(/[\u1000-\u109F]/g) || []).length;
  const latinChars = (text.match(/[A-Za-z]/g) || []).length;

  return (
    myanmarChars < 12 ||
    latinChars > 6 ||
    /ဘာသာပြန်|motivation|message|assistant|AI/i.test(text) ||
    text.length < 18 ||
    /(သင်|သင့်|ကြိုးစားပါ|အောင်မြင်မှု|ဖြစ်နိုင်ပါတယ်|မစိုးရိမ်ပါနဲ့|ယုံကြည်ပါ|အကောင်းဆုံး|မင်္ဂလာပါ|သင်လုပ်နိုင်ပါတယ်|အောင်မြင်လာပါလိမ့်မယ်)/.test(text) ||
    /[:：]/.test(text)
  );
}

function getNaturalMyanmarFallback(mood) {
  const messages = {
    happy: [
      "ဒီအရှိန်ကောင်းကို ဆက်ထိန်းထား၊ မင်းလုပ်နေသမျှက တကယ် အဓိပ္ပာယ်ရှိနေတယ်။",
      "ဒီနေ့စိတ်ကောင်းနေတာကို အားဖြစ်အောင်ယူပြီး ဆက်သွား၊ မင်းသွားနေတဲ့လမ်းက တကယ်ကောင်းတဲ့ဘက်ကို ရောက်နေတယ်။",
    ],
    sad: [
      "အခုလိုစိတ်ကျနေလည်း အားလုံးပြီးသွားတာမဟုတ်ဘူး၊ ခဏနားပြီး ဖြည်းဖြည်းပြန်စလို့ရတယ်။",
      "ဒီနေ့ခက်နေရင်တောင် မင်းမရှုံးသေးဘူး၊ တစ်လှမ်းချင်းပြန်ထဖို့ အားက မင်းဆီမှာ ရှိသေးတယ်။",
    ],
    tired: [
      "ပင်ပန်းနေရင် ခဏနားတာ မမှားဘူး၊ အားပြန်စုလိုက်ပြီး ဖြည်းဖြည်းဆက်သွားရင်လည်း ရောက်တယ်။",
      "ဒီနေ့နှေးနေလည်း ပြဿနာမရှိဘူး၊ မင်းမရပ်သရွေ့ နည်းနည်းချင်းတော့ ရှေ့ကို သွားနေတုန်းပဲ။",
    ],
    stressed: [
      "အကုန်တစ်ခါတည်းမကိုင်တွယ်လို့ရလည်း မလိုဘူး၊ တစ်ခုချင်း ဖြည်းဖြည်းလုပ်သွားရင် ပြေလည်သွားမယ်။",
      "စိတ်ဖိစီးနေတာက မင်းမတော်လို့မဟုတ်ဘူး၊ အခုဝန်တွေများနေလို့ပဲ ဖြစ်တာဆိုတော့ ဖြည်းဖြည်းရှင်းသွားရင် ရတယ်။",
    ],
  };

  const list = messages[mood] || ["မင်းဖြည်းဖြည်းဆက်သွားနေတာကတောင် တိုးတက်မှုပါပဲ။"];
  return list[Math.floor(Math.random() * list.length)];
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors() });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(
        `<!doctype html><html><body style="font-family:Arial;padding:24px">
        <h1>Motivation Bot API ✅</h1>
        <p>Use <code>POST /api/motivate</code> with JSON {"name","mood"}.</p>
        </body></html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    if (request.method === "GET" && url.pathname === "/api/motivate") {
      return json({ ok: true, hint: "POST JSON {name, mood} to /api/motivate" });
    }

    if (url.pathname !== "/api/motivate") {
      return json({ error: "Not found" }, 404);
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const cap = await checkDailyCap();
    if (!cap.ok) {
      return json({ error: "Daily AI limit reached. Try again tomorrow." }, 429);
    }

    if (!env.AI) {
      return json({ error: "AI binding missing on this Worker." }, 503);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const name = String(body?.name || "").trim().slice(0, 40);
    const mood = String(body?.mood || "").trim().toLowerCase();
    const language = String(body?.language || "en").trim().toLowerCase() === "my" ? "my" : "en";

    if (!name) return json({ error: "Please enter your name." }, 400);

    const allowed = new Set(["happy", "sad", "tired", "stressed"]);
    if (!allowed.has(mood)) return json({ error: "Invalid mood." }, 400);

    const moodLabels = {
      en: { happy: "happy", sad: "sad", tired: "tired", stressed: "stressed" },
      my: { happy: "ပျော်ရွှင်", sad: "ဝမ်းနည်း", tired: "ပင်ပန်း", stressed: "စိတ်ဖိစီး" },
    };

    const messages = buildMessages({ name, mood, language, moodLabels });

    try {
      const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
        messages,
      });

      const message = String(result?.response || "").trim();
      if (!message) return json({ error: "AI returned empty response." }, 502);

      const cleanedMessage = language === "my"
        ? trimToCompleteMyanmarSentences(cleanMyanmarMessage(message))
        : message.trim();
      const finalMessage = language === "my" && (isWeakMyanmarMessage(cleanedMessage) || looksIncompleteMyanmarMessage(cleanedMessage))
        ? getNaturalMyanmarFallback(mood)
        : cleanedMessage;

      return json({ message: finalMessage, language });
    } catch (e) {
      return json({ error: "AI failed (quota/service). Try again tomorrow." }, 429);
    }
  },
};
