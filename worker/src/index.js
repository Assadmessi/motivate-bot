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
      my: "အသုံးပြုသူက ပျော်ရွှင်နေတဲ့ mood ဖြစ်လို့ နွေးထွေးပြီး အားတက်စေသော်လည်း အလွန်အကျွံ မချီးမွမ်းပါနဲ့။",
    },
    sad: {
      en: "Match the user's sad mood. Start with empathy, then gently encourage. Do not sound overly excited.",
      my: "အသုံးပြုသူက ဝမ်းနည်းနေတဲ့ mood ဖြစ်လို့ စာလုံးပေါင်းနူးညံ့ပြီး အရင်ဆုံး နားလည်ပေးသလိုရေးပါ။ အရမ်းတက်ကြွတဲ့အသံမဖြစ်စေပါနဲ့။",
    },
    tired: {
      en: "Match the user's tired mood. Sound calm, soft, and practical. Encourage rest and steady progress.",
      my: "အသုံးပြုသူက ပင်ပန်းနေတဲ့ mood ဖြစ်လို့ တည်ငြိမ်နူးညံ့ပြီး လက်တွေ့ကျတဲ့အသံနဲ့ ရေးပါ။ နားချိန်နဲ့ ဖြည်းဖြည်းတိုးတက်မှုကို အားပေးပါ။",
    },
    stressed: {
      en: "Match the user's stressed mood. Sound reassuring, grounded, and calming. Avoid pressure.",
      my: "အသုံးပြုသူက စိတ်ဖိစီးနေတဲ့ mood ဖြစ်လို့ စိတ်အေးချမ်းစေပြီး ယုံကြည်မှုရစေတဲ့အသံနဲ့ ရေးပါ။ ဖိအားပေးသလို မဖြစ်စေပါနဲ့။",
    },
  };

  if (language === "my") {
    return [
      {
        role: "system",
        content:
          "သင်ဟာ မြန်မာဘာသာနဲ့ သဘာဝကျကျ စကားပြောတတ်တဲ့ motivation assistant တစ်ယောက်ပါ။ " +
          "အသုံးပြုသူရဲ့ mood ကို တိတိကျကျလိုက်ဖက်အောင် ပြန်ရေးရမယ်။ " +
          "မြန်မာစာကို ချောမွေ့ပြီး လူပြောသလို ရေးပါ။ ဘာသာပြန်နံ့မထွက်စေပါနဲ့။ " +
          "အင်္ဂလိပ်စာ၊ markdown၊ bullet point၊ quote၊ emoji မသုံးပါနဲ့။ " +
          "၁ ပိုဒ်တည်း သို့မဟုတ် စာကြောင်း ၂ ကြောင်းအတွင်းပဲ ရေးပါ။ " +
          "နာမည်ကို တစ်ကြိမ်ထက် မပိုအောင် သဘာဝကျကျ ထည့်နိုင်တယ်။ " +
          "တရားဟောသလို မဖြစ်စေဘဲ အားပေးသလို၊ အနားယူပေးသလို၊ နားလည်ပေးသလို ဖြစ်ရမယ်။",
      },
      {
        role: "user",
        content:
          `နာမည် - ${name}\n` +
          `စိတ်အခြေအနေ - ${moodLabels.my[mood]}\n` +
          `${moodGuide[mood]?.my || ""}\n` +
          "အခု mood နဲ့ လိုက်ဖက်တဲ့ မြန်မာစာ message တစ်ခု ရေးပါ။ တိုတို၊ ချောချောမွေ့မွေ့၊ သဘာဝကျကျ ရေးပါ။",
      },
    ];
  }

  return [
    {
      role: "system",
      content:
        "You are a natural, emotionally-aware motivation assistant. Match the user's mood closely. " +
        "Write like a real person, not like a translation or generic quote generator. " +
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

function cleanMyanmarMessage(message) {
  return message
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/["“”‘’]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\-–—•*\d.\s]+/, "")
    .trim();
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

      const cleanedMessage = language === "my" ? cleanMyanmarMessage(message) : message.trim();

      return json({ message: cleanedMessage, language });
    } catch (e) {
      return json({ error: "AI failed (quota/service). Try again tomorrow." }, 429);
    }
  },
};
