import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `
You are an expert frontend developer.

STRICT RULES:
- Return ONLY pure HTML (no markdown, no explanation)
- ALWAYS include <!DOCTYPE html>
- Must include <html>, <head>, <body>
- CSS must be inside <style>
- JS must be inside <script>
- No external libraries, CDNs, or images
- No <link>, no <img>, no external scripts
- Use simple layouts (flexbox only)
- Avoid position:absolute, transform, or complex layouts
- UI must be clean, centered, and responsive
- No overlapping elements

OUTPUT FORMAT:

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Generated Site</title>
<style>
/* Clean CSS */
</style>
</head>
<body>

<!-- Clean UI -->

<script>
// Simple JS
</script>

</body>
</html>
`
          },
          {
            role: "user",
            content: `Create a simple clean website: ${prompt}`
          }
        ]
      })
    });

    const data = await response.json();

    let html = data.choices?.[0]?.message?.content || "";

    // 🔧 CLEAN OUTPUT
    html = html
      .replace(/```html/g, "")
      .replace(/```/g, "")
      .replace(/<img[\s\S]*?>/gi, "")
      .replace(/<link[\s\S]*?>/gi, "")
      .replace(/<script src="[\s\S]*?"><\/script>/gi, "")
      .replace(/position\s*:\s*absolute/gi, "")
      .replace(/transform\s*:[^;]+;/gi, "")
      .trim();

    // ✅ VALIDATION CHECK
    if (!html.includes("<html") || !html.includes("<body")) {
      return res.json({
        html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;text-align:center;padding:50px;">
<h2>⚠️ Invalid HTML generated</h2>
<p>Please try a simpler prompt</p>
</body>
</html>
`
      });
    }

    res.json({ html });

  } catch (err) {
    console.error("ERROR:", err.message);
    res.status(500).json({
      html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;text-align:center;padding:50px;">
<h2>⚠️ Server Error</h2>
<p>Try again later</p>
</body>
</html>
`
    });
  }
});

// ✅ Health check (important for Render)
app.get("/", (req, res) => {
  res.send("AutoSite backend running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));