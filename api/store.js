import { kv } from '@vercel/kv';

const PREFIX = 'ponete-la10:';

function noCache(res){
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma','no-cache');
  res.setHeader('Expires','0');
}

function safeKey(key){
  key = String(key || '').trim();
  if(!key) return null;
  if(key.length > 140) return null;
  if(key === '__proto__' || key === 'prototype' || key === 'constructor') return null;
  if(!/^[a-zA-Z0-9:_\-.]+$/.test(key)) return null;
  return PREFIX + key;
}

export default async function handler(req,res){
  noCache(res);
  try{
    const key = safeKey(req.query.key || req.body?.key);
    if(!key) return res.status(400).json({ok:false,error:'Clave no permitida'});

    if(req.method === 'GET'){
      const value = await kv.get(key);
      return res.status(200).json({ok:true,exists:value !== null && value !== undefined,value:value ?? null});
    }

    if(req.method === 'POST'){
      const value = req.body?.value;
      if(typeof value !== 'string') return res.status(400).json({ok:false,error:'Valor inválido'});
      await kv.set(key,value);
      return res.status(200).json({ok:true});
    }

    if(req.method === 'DELETE'){
      await kv.del(key);
      return res.status(200).json({ok:true});
    }

    return res.status(405).json({ok:false,error:'Método no permitido'});
  }catch(error){
    return res.status(500).json({ok:false,error:error.message});
  }
}
