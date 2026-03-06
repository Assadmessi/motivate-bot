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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors() });
    }

    // Home
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(
        `<!doctype html><html><body style="font-family:Arial;padding:24px">
        <h1>Motivation Bot API ✅</h1>
        <p>Use <code>POST /api/motivate</code> with JSON {"name","mood"}.</p>
        </body></html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // GET check
    if (request.method === "GET" && url.pathname === "/api/motivate") {
      return json({ ok: true, hint: "POST JSON {name, mood} to /api/motivate" });
    }

    // Route
    if (url.pathname !== "/api/motivate") {
      return json({ error: "Not found" }, 404);
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    // Daily cap
    const cap = await checkDailyCap();
    if (!cap.ok) {
      return json({ error: "Daily AI limit reached. Try again tomorrow." }, 429);
    }

    // Binding guard
    if (!env.AI) {
      return json({ error: "AI binding missing on this Worker." }, 503);
    }

    // Parse JSON
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

    const prompt = language === "my"
      ? `မြန်မာဘာသာနဲ့ပဲ တိုတိုရှင်းရှင်း၊ နူးညံ့ပြီး လက်တွေ့ကျတဲ့ စိတ်ခွန်အားပေး စာတို ၁ ပိုဒ် သို့မဟုတ် ၂ ပိုဒ်အထိ ရေးပါ။ markdown မသုံးပါနဲ့။ quote မထည့်ပါနဲ့။ အင်္ဂလိပ်မရေးပါနဲ့။ အသုံးအနှုန်းက သဘာဝကျပြီး နားလည်လွယ်ရမယ်။ နာမည် - ${name}။ စိတ်အခြေအနေ - ${moodLabels.my[mood]}။` 
      : `Write a short, kind, practical motivational message (1-2 sentences max). No quotes, no markdown. Name: ${name}. Mood: ${moodLabels.en[mood]}.`;

    try {
      const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
        messages: [{ role: "user", content: prompt }],
      });

      const message = String(result?.response || "").trim();
      if (!message) return json({ error: "AI returned empty response." }, 502);

      const cleanedMessage = language === "my"
        ? message
            .replace(/[​-‍﻿]/g, "")
            .replace(/\s+/g, " ")
            .trim()
        : message;

      return json({ message: cleanedMessage, language });
    } catch (e) {
      return json({ error: "AI failed (quota/service). Try again tomorrow." }, 429);
    }
  },
};