// API optimizada para síntesis más rápida y clara

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
          content: 'Eres un intérprete simbólico del Codex Hermético. Tu estilo es místico pero claro. Nunca menciones nombres de las cartas. Comienza interpretando cada fragmento con belleza, luego haz una síntesis profunda conectando con el deseo del usuario, y finaliza con una invitación a elegir entre dos caminos. Usa un lenguaje emocional pero elegante.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 700
    });

    const result = completion.choices[0].message.content;

    res.status(200).json({ synthesis: result });
  } catch (error) {
    console.error('[Codex Error]', error);
    res.status(500).json({ error: 'Error generating synthesis' });
  }
}

function buildPrompt({ fragments, intent }) {
  const descriptions = fragments.map((f, i) => `Fragmento ${i + 1}: ${f["Mensaje/Interpretación"]}`).join("\n\n");

  return `Eres un intérprete simbólico del Codex Hermético. El usuario ha elegido estos cuatro fragmentos con la intención de manifestar: \"${intent}\".

Haz lo siguiente:

1. Interpreta cada uno de los cuatro fragmentos individualmente, con un tono místico pero claro. Evoca imágenes simbólicas, emociones humanas profundas y reflexiones espirituales. No menciones los nombres de las cartas.

2. Luego haz una interpretación holística: integra el mensaje completo de los cuatro fragmentos en relación con la intención del usuario, revelando un mensaje poderoso, práctico y transformador.

3. Termina con una invitación final: presenta dos caminos (sin mencionar cartas), como una decisión crucial que el usuario debe tomar para avanzar. Despierta curiosidad, emoción y una sensación de destino.

Fragmentos elegidos:

${descriptions}`;
}
