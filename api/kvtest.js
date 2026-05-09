import { kv } from '@vercel/kv';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const key='ponete-la10:kv_test';
    await kv.set(key, String(Date.now()));
    const value=await kv.get(key);
    res.status(200).json({ok:true,value});
  }catch(e){res.status(500).json({ok:false,error:e.message});}
}
