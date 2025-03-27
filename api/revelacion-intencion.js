// API optimizada del Codex Hermético con GPT-3.5 (versión mejorada)

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
      const match = codexData.find(card => String(card.ID) === String(id));
      return match;
    });

    const prompt = buildPrompt({ fragments: selectedFragments, intent });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un guía místico y alquímico. Escribe de forma simbólica, poética y clara, sin mencionar el nombre de las cartas, y sin comparaciones con el tarot. Evoca transformación interior y sabiduría universal con un lenguaje accesible pero elevado.'
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
  const fragmentDescriptions = fragments.map((f, i) => `Fragmento ${i + 1} →\nSímbolos: ${f.Simbolismo}\nInterpretación: ${f["Mensaje/Interpretación"]}`).join("\n\n");

  return `Un buscador ha manifestado la intención de transformar su vida a través del camino de: "${intent}". Ha recibido 4 fragmentos del Codex Hermético.

Tu tarea es canalizar una revelación profunda que conecte los símbolos y mensajes de esos fragmentos con la intención declarada. Utiliza un lenguaje que inspire, que toque el deseo, el anhelo, el miedo y la transformación.

Estructura del mensaje:
1. Descripción canalizada de cada fragmento sin mencionar que son cartas (usa "símbolo", "figura", "mensaje", "principio").
2. Una reflexión integradora que conecte los mensajes con la intención del usuario.
3. Un cierre dramático e inspirador: dile que dos fragmentos lo esperan para revelar el siguiente peldaño de su camino. No reveles aún cuáles son. Habla de una decisión que solo el alma puede tomar.

Evita en todo momento mencionar la palabra "carta" o "tarot". Esta experiencia es única y sagrada.

Fragmentos recibidos:

${fragmentDescriptions}

Intención declarada: ${intent}`;
}
