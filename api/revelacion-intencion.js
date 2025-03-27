// Nueva API con interpretación simbólica avanzada para manifestación

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
      const match = codexData.find(card => card.ID.toString() === id.toString());
      return match;
    });

    const prompt = buildPrompt({ fragments: selectedFragments, intent });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un intérprete simbólico del Codex Hermético. Escribe con un tono alquímico, místico, emocional y profundamente visionario.'
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
  const fragmentDescriptions = fragments.map(f => `Símbolo: ${f["Mensaje/Interpretación"]}\nSignificado: ${f.Simbolismo}`).join("\n\n");

  return `Un buscador ha seleccionado 4 fragmentos simbólicos del Codex Hermético con la intención de manifestar: \"${intent}\".

Tu tarea es canalizar un mensaje simbólico y profundo que integre los significados ocultos de esos 4 fragmentos sin mencionar sus nombres. Refleja cómo estos símbolos se relacionan con el deseo del buscador. 

Cada fragmento puede representar un aspecto del proceso de transformación, aprendizaje, sombra o revelación. La interpretación debe ser evocadora, con lenguaje místico, pero también accesible y emocionalmente resonante.

Luego, ofrece una síntesis general que unifique el mensaje completo de los símbolos, conectándolo con la intención manifestada. Esta parte debe sentirse como una comprensión reveladora o una visión más clara del camino del buscador.

Por último, invita al usuario a tomar una gran decisión, eligiendo entre dos caminos ocultos. No menciones los nombres de los fragmentos restantes ni des pistas visuales. Habla de ellos como \"dos fragmentos\", \"dos caminos\", \"dos símbolos que esperan\". La invitación debe sonar trascendente y dramática, como una bifurcación crucial del alma.

Mantén el tono místico, elegante, visionario y profundamente conectado al viaje interior del buscador.

Fragmentos seleccionados:\n\n${fragmentDescriptions}`;
}
