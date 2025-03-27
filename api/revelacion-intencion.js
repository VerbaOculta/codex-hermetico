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
      return codexData.find(card => card.ID.toString() === id.toString());
    });

    const prompt = buildPrompt({ fragments: selectedFragments, intent });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un intérprete simbólico del Codex Hermético. Escribe con un tono místico y visionario, pero claro y cercano. No menciones la palabra "carta" ni hagas referencias a tarot. Habla de símbolos, fragmentos o mensajes.'
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
  const fragmentDescriptions = fragments.map(f => `Símbolo: ${f.Nombre}\nMensaje: ${f["Mensaje/Interpretación"]}\nSimbolismo: ${f.Simbolismo}`).join("\n\n");

  return `Un buscador ha recibido 4 fragmentos simbólicos del Codex Hermético con la intención de manifestar: "${intent}".

Tu tarea es canalizar un mensaje simbólico y emocionalmente resonante, que una los significados de los fragmentos con el deseo declarado. El texto debe evocar tanto lo místico como lo práctico: tocar el alma, pero también dar claridad sobre lo que debe transformarse para avanzar.

Evita toda mención a "cartas". Usa "símbolos", "fragmentos", "mensajes" o "sabiduría revelada". No expliques qué representa cada símbolo, sino que integra todo en una interpretación canalizada.

Estructura sugerida:
1. Apertura personalizada según la intención.
2. Desarrollo canalizado que integre los fragmentos seleccionados con el deseo profundo del usuario.
3. Interpretación final integradora.
4. Cierre dramático con una invitación a tomar una decisión entre dos caminos posibles (sin decir qué son ni describirlos).

Fragmentos seleccionados:

${fragmentDescriptions}

Intención: ${intent}`;
}
