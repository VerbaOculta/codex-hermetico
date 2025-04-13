
import { OpenAI } from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { selectedCards, intent } = req.body;

  if (!selectedCards || !intent) {
    return res.status(400).json({ error: 'Faltan datos: selectedCards o intent' });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'codex-hermetico.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const codexData = JSON.parse(fileContents);

    const selectedFragments = selectedCards.map((id) => {
      const match = codexData.find(card => String(card.ID) === String(id));
      return match
        ? `${match.Nombre} — ${match["Mensaje/Interpretación"]}`
        : `Fragmento ${id}: símbolo desconocido`;
    });

    const prompt = `
Has recibido cuatro fragmentos del Codex Hermético.
Cada uno lleva consigo un principio ancestral que vibra con tu búsqueda interior.

Tu intención declarada es: **${intent}**

A partir de esta intención, y considerando estos fragmentos:

- ${selectedFragments[0]}
- ${selectedFragments[1]}
- ${selectedFragments[2]}
- ${selectedFragments[3]}

...canaliza una guía profunda, simbólica y transformadora. No expliques carta por carta. Entrelaza su esencia en una sola reflexión que hable al alma del buscador. Usa un lenguaje evocador, con ritmo y resonancia, que invite a la introspección.

Puedes destacar con color dorado las palabras clave si es coherente. Si algún símbolo (☉ ☽ 🜁 🜃 🜄 🜂 ⚶ 🜔) resuena con el mensaje, incorpóralo de forma sutil.

Concluye con un susurro alquímico que invite al lector a elegir su siguiente paso, sin decirlo explícitamente.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.85,
      max_tokens: 650,
      messages: [
        {
          role: 'system',
          content: 'Eres un mentor alquímico práctico que interpreta símbolos del Codex Hermético en tono claro, inspirador y significativo. Formatea palabras clave con <span class="dorado"> cuando corresponda.'
        },
        {
          role: 'user',
          content: prompt.trim()
        }
      ]
    });

    console.log("[DEBUG] Prompt generado:", prompt);
    const synthesis = completion.choices[0]?.message?.content?.trim();
    res.status(200).json({ synthesis });

  } catch (error) {
    console.error('[Codex Error] /api/revelacion-intencion', error);
    res.status(500).json({ error: 'Error generando la interpretación final.' });
  }
}
