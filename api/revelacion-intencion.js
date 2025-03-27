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
      return codexData.find(card => String(card.ID) === String(id));
    });

    const prompt = buildPrompt({ fragments: selectedFragments, intent });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un intérprete simbólico del Codex Hermético. Escribe con un tono alquímico, místico y visionario.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000
    });

    const result = completion.choices[0].message.content;

    res.status(200).json({ synthesis: result });
  } catch (error) {
    console.error('[Codex Error]', error);
    res.status(500).json({ error: 'Error generating synthesis' });
  }
}

function buildPrompt({ fragments, intent }) {
  const fragmentDescriptions = fragments
    .filter(f => f)
    .map(f => `Carta: ${f.Nombre}\nMensaje: ${f["Mensaje/Interpretación"]}\nSimbolismo: ${f.Simbolismo}`)
    .join("\n\n");

  return `Un usuario ha elegido 4 cartas del Codex Hermético con la intención de manifestar: "${intent}".

Debes canalizar un mensaje simbólico y profundo que integre el mensaje de las 4 cartas con la intención del usuario. El mensaje debe tocar emociones reales (deseos, carencias, miedos, anhelos) vinculadas a esa intención. Luego, dile que dos fragmentos han sido elegidos y que debe tomar una decisión.

Mantén un tono místico, pero más cercano, como si bajaras del plano simbólico a uno más íntimo. Haz referencia directa a la intención y al proceso vivido. Termina con una invitación dramática a elegir.

Cartas seleccionadas:

${fragmentDescriptions}

Intención: ${intent}

Estructura sugerida:
1. Canalización de las 4 cartas con la intención.
2. Reflexión profunda.
3. Invitación a elegir entre 2 cartas sin revelar aún cuáles son.`;
}
