export default async function handler(req, res) {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send("нет url");

    const response = await fetch(url);
    if (!response.ok) return res.status(500).send("не могу получить файл");

    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/octet-stream"
    );
    res.send(buffer);

  } catch (err) {
    res.status(500).send("error: " + err.message);
  }
}
