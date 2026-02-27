function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/motivate") {
      return json({ ok: true, hint: "POST JSON {name, mood} to /api/motivate" });
    }

    if (url.pathname !== "/api/motivate" || request.method !== "POST") {
      return new Response(null, { status: 404 });
    }

    const { name, mood } = await request.json();
    if (!name || !mood) return json({ error: "Missing name or mood" }, 400);

    const prompt = `Write 1-2 short kind motivational sentences for ${name} who feels ${mood}. No quotes, no markdown.`;

    // This requires the AI binding to exist as env.AI
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
      messages: [{ role: "user", content: prompt }],
    });

    return json({ message: result.response });
  },
};