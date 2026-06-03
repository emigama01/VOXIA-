// VOXIA — Backend del chat (función serverless)
// -------------------------------------------------------------
// Coloca este archivo en:  api/chat.js   (junto a tu index.html)
// Funciona en Vercel directamente. También sirve de base para
// Netlify Functions o Cloudflare Workers (ver LEEME-backend-chat.md).
//
// IMPORTANTE: tu clave NUNCA va en el HTML. Se guarda como variable
// de entorno ANTHROPIC_API_KEY en el panel de tu hosting.
// -------------------------------------------------------------

export default async function handler(req, res) {
  // CORS (por si el front está en otro dominio)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: "Falta la variable ANTHROPIC_API_KEY" });

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const { system, messages } = body;

    if (!Array.isArray(messages))
      return res.status(400).json({ error: "messages debe ser un array" });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6", // puedes cambiar el modelo aquí
        max_tokens: 1000,
        system: system || "",
        messages,
      }),
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });

    const reply = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
