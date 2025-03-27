// API optimizada para síntesis más rápida y clara usando GPT-3.5 Turbo

import { promises as fs } from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un intérprete simbólico del Codex Hermético. Tu estilo es místico pero claro. Nunca menciones nombres de las cartas. Comienza interpretando cada fragmento con belleza, luego haz una síntesis conectando con el deseo del usuario, y finaliza con una invitación emocional a una elección. Usa un lenguaje elegante, humano y evocador.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500
    });

    const result = completion.choices[0].message.content;

    res.status(200).json({ synthesis: result });
  } catch (error) {
    console.error('[Codex Error]', error);
    res.status(500).json({ error: 'Error generating synthesis' });
  }
}

function buildPrompt({ fragments, intent }) {
  const descriptions = fragments.map(f => `Mensaje: ${f["Mensaje/Interpretación"]}`).join("\n\n");

  return `Un usuario busca manifestar: "${intent}". Interpreta simbólicamente los siguientes fragmentos con un tono místico pero emocionalmente claro. Luego haz una síntesis que conecte profundamente con el deseo del usuario y termina con una invitación a tomar una decisión crucial:

${descriptions}`;
}
