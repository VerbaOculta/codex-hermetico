// API para síntesis profunda considerando intención y 4 cartas del Codex

import { promises as fs } from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { selectedCards, intent } = req.body;

    if (!selectedCards || !Array.isArray(selectedCards) || selectedCards.length !== 4 || !intent) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    const filePath = path.join(process.cwd(), 'data', 'codex-hermetico.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const codexData = JSON.parse(fileContents);

    const selectedFragments = selectedCards.map((id) => {
      const match = codexData.find(card => card.ID === id);
      return match;
    });

    const prompt = buildPrompt({ fragments: selectedFragments, intent });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un intérprete simbólico del Codex Hermético. Escribe con un tono alquímico, místico y visionario, pero con claridad emocional.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1200
    });

    const result = completion.choices[0].message.content;
    res.status(200).json({ synthesis: result });
  } catch (error) {
    console.error('[Codex Error]', error);
    res.status(500).json({ error: 'Error generating synthesis' });
  }
}

function buildPrompt({ fragments, intent }) {
  const fragmentDescriptions = fragments.map(f => `Carta: ${f.Nombre}\nMensaje: ${f["Mensaje/Interpretación"]}\nSimbolismo: ${f.Simbolismo}`).join("\n\n");

  return `Un buscador ha elegido 4 cartas del Codex Hermético con la intención de manifestar: "${intent}".

Tu tarea es canalizar un mensaje profundo y místico que integre el significado simbólico de las 4 cartas con esa intención.

Estructura de la respuesta:
1. Interpretación carta por carta, vinculándolas claramente con la intención.
2. Síntesis global que una las 4 cartas en una interpretación emocionalmente significativa, cercana y poderosa.
3. Mensaje final que prepare al buscador para una elección crucial entre dos fragmentos, con un tono evocador, sin revelar cuáles.

No repitas literalmente el contenido, inspírate en su esencia. Habla en segunda persona. Usa lenguaje simbólico pero accesible. Sé íntimo, sabio y conmovedor.

Cartas seleccionadas:

${fragmentDescriptions}

Intención: ${intent}`;
}
