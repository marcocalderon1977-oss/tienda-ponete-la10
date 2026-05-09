import { kv } from '@vercel/kv';
export default async function handler(req, res){
  res.setHeader('Cache-Control','no-store');
  const value = Date.now();
  await kv.set('ponete-la10:kvtest', value);
  const saved = await kv.get('ponete-la10:kvtest');
  res.status(200).json({ok:true, value:saved});
}
