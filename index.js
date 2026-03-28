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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        messages: [
          {
            role: "system",
            content: `
You are an expert web developer.

STRICT RULES:
- Return ONLY valid HTML (no markdown)
- Include CSS inside <style>
- Include JavaScript inside <script>
- No external libraries, CDN, or images
- Everything must work offline
- Clean UI, centered layout

IMPORTANT:
Always return FULL HTML like:

<!DOCTYPE html>
<html>
<head>
<style>
/* CSS */
</style>
</head>
<body>

<!-- UI -->

<script>
// JS
</script>

</body>
</html>
`
          },
          {
            role: "user",
            content: `Create a website: ${prompt}`
          }
        ]
      })
    });

    const data = await response.json();

    let html = data.choices?.[0]?.message?.content || "";

    // Clean AI output
    html = html
      .replace(/```/g, "")
      .replace(/<img[\s\S]*?>/gi, "")
      .replace(/<link[\s\S]*?>/gi, "")
      .replace(/<script src="[\s\S]*?"><\/script>/gi, "")
      .trim();

    if (!html) {
      html = "<h1>⚠️ AI failed. Try again.</h1>";
    }

    res.json({ html });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Generation failed" });
  }
});

// Health check route (VERY IMPORTANT for Render)
app.get("/", (req, res) => {
  res.send("AutoSite backend running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));