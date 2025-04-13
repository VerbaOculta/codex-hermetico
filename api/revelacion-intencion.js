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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { selectedCards, intent } = req.body;

  if (!selectedCards || !intent) {
    return res.status(400).json({ error: 'Faltan datos: selectedCards o intent' });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'codex-hermetico.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const codexData = JSON.parse(fileContents);

    const selectedFragments = selectedCards.map((id) => {
      const match = codexData.find(card => String(card.ID) === String(id));
      return match
        ? `${match.Nombre} — ${match["Mensaje/Interpretación"]}`
        : `Fragmento ${id}: símbolo desconocido`;
    });

    const prompt = \`
El usuario ha elegido 4 fragmentos del Codex Hermético y ha manifestado una intención profunda como "abundancia", "transformación interior", "propósito", etc.

Tu tarea es canalizar una interpretación **integrada, evocadora y centrada en su búsqueda interior**. No es necesario interpretar fragmento por fragmento; en cambio, **tejer una narrativa simbólica** en torno a lo que esa selección revela sobre el camino del alma del usuario.

- **No enumeres las cartas.** Usa su esencia como guía poética para revelar una visión más profunda.
- **Destaca palabras clave** con etiquetas HTML como: <span class="dorado">sabiduría</span>, <span class="dorado">transmutación</span>, <span class="dorado">origen</span>, etc.
- Puedes incluir **símbolos alquímicos o sagrados** (☉ ☽ 🜂 🜁 🜄 🜃 ✴︎ ✧ ⟁) si surgen de forma natural.
- El tono debe ser **claro, introspectivo, elegante y simbólico**. Evita el lenguaje exagerado o místico sin propósito.
- No uses listas ni secciones. Es una interpretación fluida y profunda.

Termina la interpretación con una **invitación simbólica y personal** a elegir uno de dos caminos: uno hacia la **acción externa** (manifestación, expansión) y otro hacia la **exploración interior** (silencio, contemplación). No los nombres así, solo sugiérelos como un eco en su alma.

Fragmentos seleccionados:

1. \${selectedFragments[0]}
2. \${selectedFragments[1]}
3. \${selectedFragments[2]}
4. \${selectedFragments[3]}

Intención manifestada:
\${intent}
\`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.85,
      max_tokens: 650,
      messages: [
        {
          role: 'system',
          content: 'Eres un mentor simbólico y alquímico. Tu lenguaje es claro, rítmico y profundamente inspirador. Interpretas símbolos antiguos con el corazón abierto, invitando al usuario a descubrir su verdad interior sin imponerla.'
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
}
