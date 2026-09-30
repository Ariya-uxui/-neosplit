// Vercel serverless function — runs on Vercel's servers, never in the
// browser, so GOOGLE_VISION_API_KEY (set in Vercel's Environment
// Variables) is never exposed to anyone using the app.
//
// Receives: POST { image: "<base64 JPEG/PNG, no data: prefix>" }
// Returns:  { text: "<raw OCR text from the receipt>" }

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OCR isn't configured yet (missing API key)" });
    return;
  }

  const { image } = req.body || {};
  if (!image || typeof image !== "string") {
    res.status(400).json({ error: "No image provided" });
    return;
  }

  try {
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: image },
              // DOCUMENT_TEXT_DETECTION reads dense receipt text better
              // than plain TEXT_DETECTION, and understands Thai script.
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
              imageContext: { languageHints: ["th", "en"] },
            },
          ],
        }),
      }
    );

    const data = await visionRes.json();

    if (!visionRes.ok) {
      console.error("Vision API error:", data);
      res.status(502).json({ error: "OCR service error", detail: data?.error?.message });
      return;
    }

    const text = data?.responses?.[0]?.fullTextAnnotation?.text || "";
    if (!text) {
      res.status(200).json({ text: "", warning: "No text detected in image" });
      return;
    }

    res.status(200).json({ text });
  } catch (err) {
    console.error("OCR request failed:", err);
    res.status(500).json({ error: "OCR request failed" });
  }
}