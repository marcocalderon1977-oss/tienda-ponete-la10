import { kv } from '@vercel/kv';
export default async function handler(req,res){
  try{
    const value = Date.now();
    await kv.set('ponete-la10:test', value);
    const saved = await kv.get('ponete-la10:test');
    res.status(200).json({ok:true,value:saved});
  }catch(e){ res.status(500).json({ok:false,error:e.message}); }
}
