// archivo: routes/revelacion-intencion.js

import express from 'express';
import { OpenAI } from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

 router.post('/', async (req, res) => {
  const { selectedCards, intent } = req.body;

  if (!selectedCards || !intent) {
    return res.status(400).json({ error: 'Faltan datos: selectedCards o intent' });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'codex-hermetico.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const codexData = JSON.parse(fileContents);

    const selectedFragments = selectedCards.map((id, index) => {
      const match = codexData.find(card => card.ID === id);
      return match ? `${match.Nombre}: ${match.Simbolismo}` : `Fragmento ${id}: símbolo desconocido`;
    });

    const prompt = `
El usuario ha elegido 4 cartas del Codex Hermético, cada una representa un símbolo arquetípico. También ha manifestado una intención de vida, como "abundancia", "transformación interior", "propósito", etc.

Tu tarea es escribir una interpretación completa, profunda y práctica que conecte simbólicamente los 4 fragmentos seleccionados. Debes interpretar cada uno de ellos, integrando sus significados de forma fluida en una sola narrativa continua. No enumeres los fragmentos ni uses encabezados. Haz que sus ideas aparezcan claramente, como imágenes y reflexiones entrelazadas.

Esta interpretación debe resonar con la intención del usuario (ej: ${intent}), sin repetirla constantemente. Usa un lenguaje claro, elegante, evocador y con ritmo, pero sin exageraciones ni misticismo innecesario.

Una vez interpretados e integrados los cuatro fragmentos, concluye con una invitación introspectiva: el lector debe elegir entre dos caminos simbólicos. Uno representa el movimiento hacia afuera (acción, expansión), el otro representa la exploración interior (escucha, contemplación). No uses listas ni lo hagas explícito. Transmítelo como una decisión simbólica y personal.

---

Fragmentos seleccionados:

1. ${selectedFragments[0]}
2. ${selectedFragments[1]}
3. ${selectedFragments[2]}
4. ${selectedFragments[3]}

Intención manifestada:
${intent}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.85,
      max_tokens: 650,
      messages: [
        {
          role: 'system',
          content: 'Eres un mentor alquímico práctico que interpreta símbolos del Codex Hermético en tono claro, inspirador y significativo.'
        },
        {
          role: 'user',
          content: prompt.trim()
        }
      ]
    });

    const synthesis = completion.choices[0]?.message?.content?.trim();
    res.status(200).json({ synthesis });

  } catch (error) {
    console.error('[Codex Error] /api/revelacion-intencion', error);
    res.status(500).json({ error: 'Error generando la interpretación final.' });
  }
});

module.exports = router;
