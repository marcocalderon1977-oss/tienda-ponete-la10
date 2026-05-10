import { kv } from '@vercel/kv';
const KEY = 'ponete-la10:ponete10_catalogos_links_v3';
export default async function handler(req, res){
  try{
    res.setHeader('Cache-Control','no-store, no-cache, must-revalidate');
    const categoria = String(req.query.categoria || '').trim();
    const raw = await kv.get(KEY);
    let data = {};
    if(typeof raw === 'string') data = JSON.parse(raw || '{}');
    else if(raw && typeof raw === 'object') data = raw;
    if(!data || typeof data !== 'object' || Array.isArray(data)) data = {};
    if(categoria) return res.status(200).json(data[categoria] || []);
    return res.status(200).json(data);
  }catch(error){ return res.status(500).json({error:error.message}); }
}
