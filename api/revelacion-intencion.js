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

    const prompt = `Has recibido cuatro fragmentos del Codex Hermético.\nCada uno lleva consigo un principio ancestral que vibra con tu búsqueda interior.\n\nTu intención declarada es: **${intent}**\n\nA partir de esta intención, y considerando estos fragmentos:\n\n- ${selectedFragments[0]}\n- ${selectedFragments[1]}\n- ${selectedFragments[2]}\n- ${selectedFragments[3]}\n\n...canaliza una guía profunda, simbólica y transformadora. No expliques carta por carta. Entrelaza su esencia en una sola reflexión que hable al alma del buscador. Usa un lenguaje evocador, con ritmo y resonancia, que invite a la introspección.\n\nPuedes destacar con color dorado las palabras clave si es coherente. Si algún símbolo (☉ ☽ 🜁 🜃 🜄 🜂 ⚶ 🜔) resuena con el mensaje, incorpóralo de forma sutil.\n\nConcluye con un susurro alquímico que invite al lector a elegir su siguiente paso, sin decirlo explícitamente.\n\nFormatea la respuesta como HTML. Cada párrafo debe ir dentro de un <p>. Las palabras importantes puedes envolverlas en <span class='dorado'>palabra</span>.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.85,
      max_tokens: 650,
      messages: [
        {
          role: 'system',
          content: 'Eres un mentor alquímico práctico que interpreta símbolos del Codex Hermético en tono claro, inspirador y significativo. Siempre entregas respuestas en formato HTML, usando <p> y <span class=\'dorado\'> para dar vida al mensaje.'
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
