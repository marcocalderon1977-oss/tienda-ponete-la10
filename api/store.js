import { kv } from '@vercel/kv';
const PREFIX = 'ponete-la10:';

function safeKey(key){
  key = String(key || '').trim();
  if(!key) return null;
  if(!/^[a-zA-Z0-9:_-]{1,100}$/.test(key)) return null;
  return PREFIX + key.replace(/^ponete-la10:/,'');
}

export default async function handler(req, res){
  try{
    res.setHeader('Cache-Control','no-store, no-cache, must-revalidate');
    const key = safeKey(req.query.key || req.body?.key);
    if(!key) return res.status(400).json({error:'Clave no permitida'});

    if(req.method === 'GET'){
      const value = await kv.get(key);
      return res.status(200).json({exists:value !== null && value !== undefined, value:value ?? null});
    }

    if(req.method === 'POST'){
      let value = req.body?.value;
      if(typeof value !== 'string') value = JSON.stringify(value ?? null);
      await kv.set(key, value);
      return res.status(200).json({ok:true});
    }

    if(req.method === 'DELETE'){
      await kv.del(key);
      return res.status(200).json({ok:true});
    }

    return res.status(405).json({error:'Método no permitido'});
  }catch(error){
    return res.status(500).json({error:error.message});
  }
}
