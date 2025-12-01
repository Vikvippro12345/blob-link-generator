// api/fetch.js
export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send("Missing url");

    const r = await fetch(url);
    if (!r.ok) return res.status(500).send("Failed to fetch URL");

    const arrayBuffer = await r.arrayBuffer();

    res.setHeader("Content-Type", r.headers.get("content-type") || "application/octet-stream");
    res.send(Buffer.from(arrayBuffer));
  } catch (e) {
    res.status(500).send("Server error");
  }
}
