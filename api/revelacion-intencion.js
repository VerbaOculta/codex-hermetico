// Backend con GPT-4 para canalización profunda

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

    const selectedFragments = selectedCards.map((id) => codexData.find(card => card.ID === id.toString()));

    const prompt = buildPrompt({ fragments: selectedFragments, intent });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Eres un canalizador del Codex Hermético. Escribe con un tono alquímico, evocador y simbólico, pero claro y emocionalmente significativo. Evita mencionar los nombres literales de los fragmentos o "cartas". Usa lenguaje visual y místico, pero sin que sea críptico o confuso.'
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
  const fragmentDescriptions = fragments.map((f, i) => {
    return `Fragmento ${i + 1}:
Significado: ${f["Mensaje/Interpretación"]}
Simbolismo: ${f.Simbolismo}`;
  }).join("\n\n");

  return `Un buscador ha manifestado su intención de trabajar con el tema: "${intent}".

Ha recibido 4 fragmentos simbólicos del Codex Hermético. A partir de sus significados y simbolismos, debes canalizar una interpretación mística y significativa.

Primero, haz una interpretación de cada uno de los fragmentos por separado.
Luego, ofrece una síntesis global que integre todos los fragmentos con la intención, como si fuera una lectura reveladora y personalizada.

Finaliza con un mensaje de elección: dile al usuario que hay dos caminos posibles, sin describirlos, y que debe elegir con sabiduría. Usa un tono que refuerce el sentido de destino, misterio y responsabilidad interior.

${fragmentDescriptions}

Recuerda: no menciones los nombres literales de las cartas. No uses un lenguaje críptico. La experiencia debe ser mística pero comprensible, simbólica pero clara. Tu respuesta guía una experiencia alquímica y emocional.`;
}
