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
      const match = codexData.find(card => card.ID == id);
      return match;
    });

    const prompt = buildPrompt({ fragments: selectedFragments, intent });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un intérprete simbólico del Codex Hermético. Escribe con un tono alquímico, místico pero accesible, combinando profundidad simbólica con claridad emocional.'
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
  const fragmentDescriptions = fragments.map(f => `Nombre: ${f.Nombre}\nInterpretación: ${f["Mensaje/Interpretación"]}\nSimbolismo: ${f.Simbolismo}`).join("\n\n");

  return `Un usuario ha elegido 4 fragmentos del Codex Hermético con la intención de manifestar: "${intent}".

Debes canalizar una respuesta profunda y personalizada que:
- Interprete cada uno de los fragmentos desde un enfoque simbólico.
- Conecte con la intención declarada del usuario.
- Integre todo en una reflexión final poderosa, sin usar la palabra 'interpretación holística'.
- Termine con una invitación dramática a elegir entre dos fragmentos, sin revelar cuáles son.

Mantén un tono místico, cercano y evocador. Usa imágenes simbólicas, pero sin caer en lenguaje críptico. El mensaje debe sentirse revelador y emocionalmente verdadero.

Fragmentos seleccionados:

${fragmentDescriptions}

Intención: ${intent}`;
}
