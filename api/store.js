import { kv } from '@vercel/kv';

const PREFIX = 'ponete-la10:';

// Seguridad básica: solo claves simples del sitio, sin espacios ni símbolos raros.
function cleanKey(key){
  key = String(key || '').trim();
  if(!key) return null;
  if(key.length > 90) return null;
  if(!/^[A-Za-z0-9_\-:.]+$/.test(key)) return null;
  return key;
}

function safeKey(key){
  const clean = cleanKey(key);
  if(!clean) return null;
  return PREFIX + clean;
}

function publicKey(fullKey){
  return String(fullKey || '').startsWith(PREFIX)
    ? String(fullKey).slice(PREFIX.length)
    : String(fullKey || '');
}

export default async function handler(req, res){
  try{
    res.setHeader('Cache-Control','no-store, no-cache, must-revalidate');
    res.setHeader('Pragma','no-cache');
    res.setHeader('Expires','0');

    // GET /api/store?all=1  -> trae todos los datos del sitio para celular/computadora
    if(req.method === 'GET' && String(req.query.all || '') === '1'){
      const keys = await kv.keys(`${PREFIX}*`);
      const data = {};
      for(const full of keys || []){
        const k = publicKey(full);
        const value = await kv.get(full);
        if(typeof value === 'string') data[k] = value;
        else if(value !== null && value !== undefined) data[k] = JSON.stringify(value);
      }
      return res.status(200).json({ ok:true, data });
    }

    const key = safeKey(req.query.key || req.body?.key);
    if(!key) return res.status(400).json({ error:'Clave inválida' });

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
