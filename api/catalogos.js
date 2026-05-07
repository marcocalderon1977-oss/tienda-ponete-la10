import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    const categoria = req.query.categoria;

    if (!categoria) {
      return res.status(400).json({ error: 'Falta categoria' });
    }

    const key = `catalogos:${categoria}`;
    const lista = (await kv.get(key)) || [];

    return res.status(200).json(lista);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
