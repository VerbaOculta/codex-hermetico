import { promises as fs } from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');


  const allowedOrigin = 'https://www.omnipresence.info/';
  const requestOrigin = req.headers.origin;

  if (requestOrigin !== allowedOrigin) {
    return res.status(403).json({ error: 'Origen no autorizado' });  
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // preflight CORS
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { selectedCards, positions, authKey } = req.body;

    if (authKey !== process.env.API_SECRET_KEY) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }
    

    if (!selectedCards || !positions || selectedCards.length !== 4) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    const filePath = path.join(process.cwd(), 'data', 'codex-hermetico.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const codexData = JSON.parse(fileContents);

    const selectedFragments = selectedCards.map((id, index) => {
      const match = codexData.find(card => String(card.ID) === String(id));
      return {
        position: positions[index],
        ...match
      };
    });

    const prompt = buildPrompt(selectedFragments);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un intérprete alquímico. Responde de forma mística y simbólica sin mencionar tarot ni cartas.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    res.status(200).json({ prediction: response });

  } catch (error) {
    console.error('[Codex API Error]', error);
    res.status(500).json({ error: 'Error generating prediction', details: error.message });
  }
}

function buildPrompt(fragments) {
  const positionTitles = {
    Umbral: '🔮 Umbral — Representa el pasado, la sombra, el impulso secreto que originó la búsqueda.',
    Voz: '🜁 Voz — Es el presente, la guía activa, la vibración que susurra desde lo invisible.',
    Desafío: '🜃 Desafío — Es el obstáculo interno, el ruido que distorsiona, la trampa o ilusión.',
    Sendero: '🜂 Sendero — Es el proceso alquímico en marcha, el aprendizaje, el destino transformador.'
  };

  const lines = fragments.map(f => {
    return `${positionTitles[f.position]}\nCarta: ${f.Nombre}\nMensaje: ${f["Mensaje/Interpretación"]}\nSimbolismo: ${f.Simbolismo}`;
  });

  return `Eres un intérprete del Codex Hermético. Tu misión es descifrar fragmentos simbólicos entregados por el buscador, en cuatro posiciones rituales. A partir de ellos, genera una lectura mística, alquímica y poética.

Interpreta el significado profundo de cada posición, revelando su sentido en el camino interior del buscador. Usa metáforas, símbolos y lenguaje arquetípico. No repitas literalmente los textos dados, pero sí inspírate en su esencia.

Fragmentos entregados:

${lines.join('\n\n')}

❗Instrucciones:
- No menciones tarot, cartas, ni tiradas.
- Habla en segunda persona con tono profético o visionario.
- La lectura debe parecer un mensaje canalizado o revelación interior.
- Puedes incluir imágenes oníricas o alquímicas (el crisol, la serpiente, el oro, la transmutación, etc.)
- Inspira, guía, desafía. Sé la voz del Codex.

Devuelve tu mensaje dividido claramente en 4 secciones, comenzando cada una con:

Umbral:
Voz:
Desafío:
Sendero:
`;
}
