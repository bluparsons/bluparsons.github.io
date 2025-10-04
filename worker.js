export default {
  async fetch(req, env) {
    const CORS = {
      "Access-Control-Allow-Origin": "*",           // or set to "https://bluparsons.github.io"
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type"
    };

    // Health check (GET /) – optional but handy
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/") {
      return new Response("OK", { status: 200, headers: CORS });
    }

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Route
    if (url.pathname !== "/api/chat") {
      return new Response("Not found", { status: 404, headers: CORS });
    }
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: CORS });
    }

    // Parse JSON
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    const messages = body?.messages ?? [{ role: "user", content: "Hello" }];

    // Call OpenAI
    let r;
    try {
      r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          messages
        }),
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Upstream fetch failed" }), {
        status: 502,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return new Response(JSON.stringify({ error: data?.error?.message || "Upstream error" }), {
        status: 502,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const text = data?.choices?.[0]?.message?.content ?? "No response";
    return new Response(JSON.stringify({ text }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
}
