import { promises as fs } from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { selectedCards, positions } = req.body;

    if (!selectedCards || !positions || selectedCards.length !== 4) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Ruta al archivo JSON local
    const filePath = path.join(process.cwd(), 'data', 'codex-hermetico.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const codexData = JSON.parse(fileContents);

    // Buscar detalles de las cartas seleccionadas
    const selectedFragments = selectedCards.map((id, index) => {
      const match = codexData.find(card => card.ID === id);
      return {
        position: positions[index],
        ...match
      };
    });

    // Construir el prompt para la IA
    const prompt = buildPrompt(selectedFragments);

    // Llamar a OpenAI con el prompt generado
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
      ]
    });

    const response = completion.choices[0].message.content;
    res.status(200).json({ result: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generating prediction' });
  }
}

function buildPrompt(fragments) {
  const positionTitles = {
    Umbral: '🔮 Umbral — La energía que inicia tu búsqueda (pasado/sombra)',
    Voz: '🜁 Voz — Lo que te habla ahora (presente/mensaje guía)',
    Desafío: '🜃 Desafío — La resistencia o bloqueo (obstáculo/ruido interno)',
    Sendero: '🜂 Sendero — La alquimia en marcha (proceso/destino)'
  };

  const lines = fragments.map(f => {
    return `${positionTitles[f.position]}\nNombre: ${f.Nombre}\nMensaje: ${f['Mensaje/Interpretación']}\nSimbolismo: ${f.Simbolismo}`;
  });

  return `Interpreta el Codex Hermético a partir de estos fragmentos:

${lines.join('\n\n')}

Entrega una lectura alquímica, poética y simbólica sin mencionar tarot ni cartas.`;
}

