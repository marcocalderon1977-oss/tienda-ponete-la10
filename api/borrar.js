
import { kv } from '@vercel/kv';
const KEY = 'ponete-la10:ponete10_catalogos_links_v3';
export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Método no permitido'});
  try{
    const categoria = String(req.body?.categoria || '').trim();
    const id = req.body?.id;
    const raw = await kv.get(KEY);
    let data = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
    if(categoria && id !== undefined && Array.isArray(data[categoria])){
      data[categoria] = data[categoria].filter(x => String(x.id) !== String(id));
    }else if(categoria){
      delete data[categoria];
    }
    await kv.set(KEY, JSON.stringify(data));
    return res.status(200).json({ok:true, data});
  }catch(error){ return res.status(500).json({error:error.message}); }
}
