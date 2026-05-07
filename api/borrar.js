import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  try {
    const { categoria, id } = req.body || {};

    if (!categoria || !id) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    const key = `catalogos:${categoria}`;
    const lista = (await kv.get(key)) || [];
    const nuevaLista = lista.filter(item => String(item.id) !== String(id));

    await kv.set(key, nuevaLista);

    return res.status(200).json({ ok: true, lista: nuevaLista });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
