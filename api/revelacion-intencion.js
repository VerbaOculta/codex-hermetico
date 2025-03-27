// Nueva API que considera intención y cartas seleccionadas

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
      const match = codexData.find(card => card.ID === String(id));
      return match;
    });

    const prompt = buildPrompt({ fragments: selectedFragments, intent });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un intérprete simbólico del Codex Hermético. Escribe con un tono alquímico, místico y visionario, pero con claridad y conexión emocional.'
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

  return `Un usuario ha elegido 4 cartas del Codex Hermético con la intención de manifestar: "${intent}".

Debes canalizar un mensaje simbólico y profundo que integre el mensaje de las 4 cartas con la intención del usuario. El mensaje debe tocar emociones reales (deseos, carencias, miedos, anhelos) vinculadas a esa intención.

Haz una interpretación carta por carta (breve pero significativa), y luego una síntesis holística que conecte todo el mensaje. Finalmente, cierra con una invitación evocadora a elegir entre dos cartas sin revelarlas.

Mantén un tono místico pero accesible, conectado con el lenguaje de transformación personal.

Cartas seleccionadas:

${fragmentDescriptions}

Intención: ${intent}

Estructura sugerida:
1. Interpretación de cada carta (breve).
2. Interpretación holística.
3. Invitación final a elegir entre 2 caminos.`;
}
