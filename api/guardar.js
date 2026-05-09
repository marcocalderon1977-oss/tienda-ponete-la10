import { kv } from '@vercel/kv';
const KEY = 'ponete-la10:ponete10_catalogos_links_v3';

function normalizeUrl(url){
  url = String(url || '').trim();
  if(url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
  return url;
}

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Método no permitido'});
  try{
    const categoria = String(req.body?.categoria || '').trim();
    const titulo = String(req.body?.titulo || req.body?.title || 'Catálogo').trim();
    const url = normalizeUrl(req.body?.url || req.body?.link || '');
    if(!categoria || !url) return res.status(400).json({error:'Faltan datos'});

    const raw = await kv.get(KEY);
    let data = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
    if(!data || typeof data !== 'object' || Array.isArray(data)) data = {};
    if(!Array.isArray(data[categoria])) data[categoria] = [];

    data[categoria].push({ id:Date.now(), titulo, url, fecha:new Date().toLocaleString('es-CR') });

    await kv.set(KEY, JSON.stringify(data));
    return res.status(200).json({ok:true, data});
  }catch(error){
    return res.status(500).json({error:error.message});
  }
}
