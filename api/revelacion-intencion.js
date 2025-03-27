// Nueva API que considera intención y cartas seleccionadas con mejor estructura narrativa

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
      return codexData.find(card => card.ID.toString() === id.toString());
    });

    const prompt = buildPrompt({ fragments: selectedFragments, intent });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un intérprete simbólico del Codex Hermético. Escribe con un tono alquímico, místico y visionario, pero cada vez más claro conforme avanza el texto.'
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
  const fragmentDescriptions = fragments.map(f => `Nombre simbólico: ${f.Nombre}\nSignificado: ${f["Mensaje/Interpretación"]}\nSímbolos clave: ${f.Simbolismo}`).join("\n\n");

  return `Un usuario ha elegido 4 fragmentos del Codex Hermético con la intención de manifestar: "${intent}".

Tu tarea es canalizar una interpretación profunda e inspiradora que conecte la intención del usuario con los 4 fragmentos seleccionados. El mensaje debe mantener un tono místico, simbólico y alquímico, pero volverse cada vez más claro y aplicable hacia el final.

Estructura de la respuesta:
1. Canalización individual de cada fragmento.
2. Interpretación holística: cómo se unen los mensajes para guiar al usuario respecto a su intención.
3. Cierre: una invitación emocional y dramática a elegir entre dos futuros posibles, sin mencionar cartas ni predicciones, apelando a su libre albedrío y a su transformación personal.

Fragmentos seleccionados:
${fragmentDescriptions}

Intención: ${intent}`;
}
