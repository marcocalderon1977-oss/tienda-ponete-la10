import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  try {
    const { categoria, titulo, link } = req.body || {};

    if (!categoria || !link) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    const key = `catalogos:${categoria}`;
    const lista = (await kv.get(key)) || [];

    lista.push({
      id: Date.now(),
      titulo: titulo || 'Catalogo',
      link,
      fecha: new Date().toISOString()
    });

    await kv.set(key, lista);

    return res.status(200).json({ ok: true, lista });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
