import { OpenAI } from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const allowedOrigin = 'https://www.omnipresence.info';
  const requestOrigin = req.headers.origin;
  
  if (requestOrigin !== allowedOrigin) {
    return res.status(403).json({ error: 'Origen no autorizado' });  
  }
  

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { selectedCards, intent, authKey } = req.body;

  if (authKey !== process.env.API_SECRET_KEY) {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }

  if (!selectedCards || !intent) {
    return res.status(400).json({ error: 'Faltan datos: selectedCards o intent' });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'codex-hermetico.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const codexData = JSON.parse(fileContents);

    const fragmentNames = selectedCards.map(id => {
      const match = codexData.find(card => String(card.ID) === String(id));
      return match ? match.Nombre : `Fragmento ${id}`;
    }).join(', ');

    const prompt = `
Una intención profunda se ha revelado: <span class='dorado'>${intent}</span>.

Los siguientes principios han sido activados desde el Codex Hermético: ${fragmentNames}.

No describas uno por uno. En lugar de eso, entrelaza sus esencias en una guía simbólica que hable directamente al alma del buscador. Tu propósito es invocar una alquimia interior.

Utiliza un lenguaje evocador, con ritmo y resonancia. Puedes integrar símbolos alquímicos (☉ ☽ 🜁 🜃 🜄 🜂 ⚶ 🜔) si resuenan con el mensaje. Destaca con <span class='dorado'>palabras clave</span> cuando sientas que es significativo.

Formatea en HTML. Cada párrafo debe ir dentro de <p>. concluye con una invitación introspectiva: el lector debe elegir entre dos caminos simbólicos. Uno representa el movimiento hacia afuera (acción, expansión), el otro representa la exploración interior (escucha, contemplación). No uses listas ni lo hagas explícito. Transmítelo como una decisión simbólica y personal.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.85,
      max_tokens: 650,
      messages: [
        {
          role: 'system',
          content: "Eres un mentor alquímico práctico que interpreta símbolos del Codex Hermético en tono claro, inspirador y significativo. Siempre entregas respuestas en formato HTML, usando <p> y <span class='dorado'> para dar vida al mensaje."
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const synthesis = completion.choices[0]?.message?.content?.trim();
    res.status(200).json({ synthesis });

  } catch (error) {
    console.error('[Codex Error] /api/revelacion-intencion', error);
    res.status(500).json({ error: 'Error generando la interpretación final.' });
  }
}
