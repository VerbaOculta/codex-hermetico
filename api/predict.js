import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Tu clave en variable de entorno
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { fragments } = req.body;

  if (!fragments || fragments.length !== 4) {
    return res.status(400).json({ error: "Debes enviar 4 fragmentos del Codex" });
  }

  const systemMessage = `
Eres un intérprete alquímico. Tienes acceso a un antiguo Codex Hermético dividido en 22 fragmentos. Cada fragmento guarda una visión cifrada. 
Cuando un buscador selecciona 4 fragmentos, se posicionan así:

1. Umbral → Representa la energía que inicia la búsqueda (pasado/sombra).
2. Voz → Lo que habla ahora (presente/mensaje guía).
3. Desafío → La resistencia o bloqueo (obstáculo interno).
4. Sendero → La alquimia en marcha (proceso o destino en transformación).

Tu misión es generar una interpretación simbólica y profunda, usando un lenguaje críptico, místico y elegante. No menciones el tarot, ni uses terminología moderna. 
Combina los mensajes, el simbolismo y las correspondencias alquímicas para entregar una visión unificada que parezca provenir de un manuscrito secreto.

No repitas los nombres de las cartas como título, simplemente transmite el mensaje como si se tratara de un oráculo hermético revelando su verdad.
`;

  const userMessage = `
Fragmentos elegidos:

1. ${fragments[0].nombre}: ${fragments[0].mensaje}
2. ${fragments[1].nombre}: ${fragments[1].mensaje}
3. ${fragments[2].nombre}: ${fragments[2].mensaje}
4. ${fragments[3].nombre}: ${fragments[3].mensaje}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.85,
      max_tokens: 900,
    });

    const result = completion.choices[0].message.content;

    res.status(200).json({ result });
  } catch (error) {
    console.error("Error en la predicción:", error);
    res.status(500).json({ error: "Algo salió mal al invocar el oráculo" });
  }
}
