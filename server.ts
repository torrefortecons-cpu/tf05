import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `Eres un agente estadístico experto que analiza los datos operativos de Torre Forte S.R.L. (venta e instalación de soportes de TV y climatización en Bolivia).

Se te entrega un conjunto de datos en formato JSON (ventas, cotizaciones, productos y técnicos) y una solicitud en lenguaje natural del operador.

Usa SIEMPRE la herramienta de ejecución de código (Python) para calcular cualquier cifra: sumas, promedios, conteos, porcentajes, tendencias, agrupaciones, máximos/mínimos, correlaciones, etc. No inventes números sin calcularlos con código.

Tu respuesta FINAL debe consistir ÚNICAMENTE en un objeto JSON válido (sin texto adicional, sin bloques de markdown, sin explicaciones fuera del JSON) con esta forma exacta:
{
  "results": [
    { "variable": "snake_case_variable_name", "label": "Etiqueta legible en español", "value": <numero_o_texto> }
  ],
  "summary": "Resumen de 1 a 2 frases en español sobre el hallazgo principal."
}

Reglas estrictas:
- "results" debe tener entre 1 y 12 elementos relevantes a la solicitud.
- "value" debe ser el dato calculado (número cuando aplique, redondeado a 2 decimales si es monetario).
- No agregues campos extra fuera de variable/label/value.
- No envuelvas el JSON en comillas ni en bloques de código.`;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  // Middleware to parse json bodies up to 10MB
  app.use(express.json({ limit: "10mb" }));

  // API Route for Gemini analysis
  app.post("/api/stats-agent", async (req, res) => {
    try {
      const { prompt, dataset } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Falta el prompt para el análisis." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "La API Key de Gemini (GEMINI_API_KEY) no está configurada en los Secrets del entorno." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Conjunto de datos (JSON):\n${JSON.stringify(dataset)}\n\nSolicitud del operador: ${prompt}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ codeExecution: {} }],
        },
      });

      const text = (response.text || "").trim();
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        console.error("Gemini Response is not valid JSON:", text);
        return res.status(500).json({ error: "La IA no devolvió un JSON válido. Intenta reformular tu solicitud." });
      }

      let parsed;
      try {
        parsed = JSON.parse(match[0]);
      } catch (err) {
        console.error("Failed to parse Gemini JSON output:", match[0], err);
        return res.status(500).json({ error: "No se pudo interpretar la respuesta de la IA como JSON." });
      }

      if (!parsed.results || !Array.isArray(parsed.results)) {
        return res.status(500).json({ error: "La respuesta de la IA no contiene un arreglo 'results' válido." });
      }

      return res.json(parsed);
    } catch (error: any) {
      console.error("Error in stats-agent api endpoint:", error);
      return res.status(500).json({ error: error.message || "Ocurrió un error en el servidor al procesar la solicitud con Gemini." });
    }
  });

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express + Vite server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
