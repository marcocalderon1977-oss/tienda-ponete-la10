
import { kv } from '@vercel/kv';

const PREFIX = 'ponete-la10:';
const ALLOWED_KEYS = new Set([
  'ponete10_catalogos_links_v3',
  'linksPro',
  'trackingRegistros'
]);

function safeKey(key){
  key = String(key || '').trim();
  if(!ALLOWED_KEYS.has(key)) return null;
  return PREFIX + key;
}

export default async function handler(req, res){
  try{
    const key = safeKey(req.query.key || req.body?.key);
    if(!key) return res.status(400).json({ error:'Clave no permitida' });

    if(req.method === 'GET'){
      const value = await kv.get(key);
      return res.status(200).json({ exists:value !== null && value !== undefined, value:value ?? null });
    }

    if(req.method === 'POST'){
      const value = req.body?.value;
      if(typeof value !== 'string') return res.status(400).json({ error:'Valor inválido' });
      await kv.set(key, value);
      return res.status(200).json({ ok:true });
    }

    if(req.method === 'DELETE'){
      await kv.del(key);
      return res.status(200).json({ ok:true });
    }

    return res.status(405).json({ error:'Método no permitido' });
  }catch(error){
    return res.status(500).json({ error:error.message });
  }
}
