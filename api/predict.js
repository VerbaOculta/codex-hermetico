export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { codexFragments } = req.body;

  if (!codexFragments || codexFragments.length !== 4) {
    return res.status(400).json({ error: 'Se requieren 4 fragmentos del Codex' });
  }

  // Preparar el mensaje para la IA
  const prompt = `
Eres un intérprete alquímico. El buscador ha revelado cuatro fragmentos del Codex Hermético. 
Interpreta su combinación de forma simbólica y profunda, sin mencionar que son cartas. 
Usa un tono místico y hermético. Las posiciones son:

— Umbral (pasado/sombra): ${codexFragments[0]}
— Voz (presente/mensaje guía): ${codexFragments[1]}
— Desafío (resistencia/bloqueo): ${codexFragments[2]}
— Sendero (proceso/destino): ${codexFragments[3]}

Ofrece una lectura simbólica que combine sus significados como una visión integrada.
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", 
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      throw new Error("Respuesta vacía del modelo");
    }

    return res.status(200).json({ interpretation: result });
  } catch (error) {
    return res.status(500).json({ error: "Error al generar interpretación", details: error.message });
  }
}
