
export default function handler(req, res) {
  const { cards } = req.query;
  res.status(200).json({
    message: `Mensaje generado para las cartas: ${cards}`
  });
}
