export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname !== "/api/chat") {
      return new Response("Not found", { status: 404 });
    }
    const { messages } = await req.json();

    // Call your model provider (OpenAI shown; swap if you like)
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",        // or another chat-capable model
        temperature: 0.2,
        messages
      })
    });
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content ?? "No response";
    return new Response(JSON.stringify({ text }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
