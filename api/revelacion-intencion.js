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

    if (selectedFragments.some(f => !f)) {
      return res.status(400).json({ error: 'One or more selected cards not found' });
    }

    const prompt = buildPrompt({ fragments: selectedFragments, intent });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Eres un intérprete simbólico del Codex Hermético. Escribe con un tono místico, pero también claro, equilibrando lo simbólico y lo aplicable. Nunca menciones nombres literales de las cartas.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800
    });

    const result = completion.choices[0].message.content;

    res.status(200).json({ synthesis: result });
  } catch (error) {
    console.error('[Codex Error]', error);
    res.status(500).json({ error: 'Error generating synthesis' });
  }
}

function buildPrompt({ fragments, intent }) {
  const fragmentDescriptions = fragments.map(f => `Fragmento simbólico:\nMensaje: ${f["Mensaje/Interpretación"]}\nSimbolismo: ${f.Simbolismo}`).join("\n\n");

  return `Un usuario ha elegido 4 fragmentos simbólicos con la intención de manifestar: "${intent}".

Canaliza un mensaje profundo que interprete los 4 fragmentos sin mencionar sus nombres, e intégralo con la intención del usuario. Habla con un tono místico pero claro, haciendo referencias a anhelos reales como miedo, deseo, carencia, aspiración. Después de interpretar uno a uno, ofrece una síntesis integradora que conecte todo. Finalmente, haz una invitación dramática a elegir entre dos caminos sin mencionar cartas.

Fragmentos elegidos:\n\n${fragmentDescriptions}\n\nIntención del usuario: ${intent}`;
}
