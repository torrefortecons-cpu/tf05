import { GoogleGenAI } from '@google/genai';

export interface StatResultItem {
  variable: string;
  label: string;
  value: number | string;
}

export interface StatAgentResult {
  summary?: string;
  results: StatResultItem[];
}

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

export async function runStatisticalAgent(prompt: string, dataset: unknown): Promise<StatAgentResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada para este entorno.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Conjunto de datos (JSON):\n${JSON.stringify(dataset)}\n\nSolicitud del operador: ${prompt}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ codeExecution: {} }],
    },
  });

  const text = (response.text || '').trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('La IA no devolvió un JSON válido. Intenta reformular tu solicitud.');
  }

  let parsed: StatAgentResult;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new Error('No se pudo interpretar la respuesta de la IA como JSON.');
  }

  if (!parsed.results || !Array.isArray(parsed.results)) {
    throw new Error('La respuesta de la IA no contiene un arreglo "results" válido.');
  }

  return parsed;
}
