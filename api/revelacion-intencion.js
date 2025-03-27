// API mejorada con interpretación personalizada y cierre dramático

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
          content: 'Eres un intérprete simbólico del Codex Hermético. Escribe con un tono alquímico, místico y visionario. Habla con belleza, pero entrega claridad emocional. No menciones cartas ni nombres explícitos.'
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
  const fragmentDescriptions = fragments.map(f => `Símbolo: ${f["Mensaje/Interpretación"]}\n\nSignificado: ${f.Simbolismo}`).join("\n\n");

  return `Un usuario ha elegido 4 fragmentos del Codex Hermético con la intención de manifestar: "${intent}".

Canaliza un mensaje simbólico, místico y emocional que integre estos fragmentos con la intención. El lenguaje debe evocar claridad interior, resonancia espiritual y transformación real. No menciones nombres ni "cartas". 

Incluye:
1. Una breve introducción conectando al usuario con su intención.
2. Una interpretación profunda de cada fragmento (en lenguaje universal, sin títulos).
3. Una síntesis final que unifique el mensaje de los 4 símbolos.
4. Un cierre dramático que le plantee al usuario una elección: algo está por revelarse, y debe escoger entre dos caminos. Haz esta invitación con poder y belleza.

Fragmentos:

${fragmentDescriptions}

Intención: ${intent}`;
}
