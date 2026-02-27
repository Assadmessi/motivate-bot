// functions/api/motivate.js

// CORS helper (safe for browser calls)
function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

// Simple JSON response helper
function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

// ---- Server-side daily cap (extra protection)
// can change this number. Keep low to stay safely under free neurons.
const DAILY_REQUEST_CAP = 300;

// A tiny, stateless “soft cap” using CF cache 

async function checkDailyCap(ctx) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const key = new Request(`https://cap.local/${today}`);

  const cache = caches.default;
  const cached = await cache.match(key);
  const count = cached ? Number(await cached.text()) : 0;

  if (count >= DAILY_REQUEST_CAP) return { ok: false, count };

  // increment
  const next = count + 1;
  await cache.put(key, new Response(String(next), { headers: { "Cache-Control": "max-age=86400" } }));
  return { ok: true, count: next };
}

export async function onRequest(context) {
  const { request, env } = context;

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders("*") });
  }

  if (request.method !== "POST") {
    return json({ error: "Not found" }, 404, corsHeaders("*"));
  }

  // Hard stop if our own daily cap reached (never spends neurons)
  const cap = await checkDailyCap(context);
  if (!cap.ok) {
    return json(
      { error: "Daily AI limit reached. Try again tomorrow." },
      429,
      corsHeaders("*")
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400, corsHeaders("*"));
  }

  const name = String(body?.name || "").trim().slice(0, 40);
  const mood = String(body?.mood || "").trim().toLowerCase();

  if (!name) return json({ error: "Please enter your name." }, 400, corsHeaders("*"));
  if (!mood) return json({ error: "Please select a mood." }, 400, corsHeaders("*"));

  const allowedMoods = new Set(["happy", "sad", "tired", "stressed"]);
  if (!allowedMoods.has(mood)) {
    return json({ error: "Invalid mood." }, 400, corsHeaders("*"));
  }

  // Prompt tuned to be short (saves neurons) + safe
  const prompt =
    `Write a short, kind, practical motivational message (1-2 sentences max). ` +
    `No quotes, no markdown. ` +
    `Name: ${name}. Mood: ${mood}.`;

  try {
    // Workers AI model reference (choose “fast” to reduce latency)
    // Model docs list these identifiers.  
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
      messages: [{ role: "user", content: prompt }],
    });

    const message = (result?.response ?? "").toString().trim();

    if (!message) {
      return json({ error: "AI returned empty response." }, 502, corsHeaders("*"));
    }

    return json({ message }, 200, corsHeaders("*"));
  } catch (err) {
    // If Cloudflare hard-limits free usage,  see errors—handle as “come back tomorrow”
    return json(
      { error: "AI limit reached for today. Try again tomorrow." },
      429,
      corsHeaders("*")
    );
  }
}