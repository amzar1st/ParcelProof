import { NextResponse } from 'next/server';
const allowed=new Set(['gen_call','gen_getContractSchema','gen_getContractCode','eth_chainId','eth_getBalance','eth_getTransactionCount','eth_gasPrice','eth_estimateGas','eth_sendRawTransaction','eth_getTransactionByHash','eth_getTransactionReceipt','eth_blockNumber','eth_getBlockByNumber','eth_getBlockByHash','sim_getTransactionByHash','sim_fundAccount','gen_getTransactionReceipt','gen_getTransactionStatus']);
export async function POST(request:Request) {
 try {
  const text=await request.text();
  if(text.length>150000) return NextResponse.json({error:{code:-32600,message:'RPC payload too large'}},{status:413});
  const payload=JSON.parse(text);
  if(payload.jsonrpc!=='2.0'||!allowed.has(payload.method)||!Array.isArray(payload.params)) return NextResponse.json({jsonrpc:'2.0',id:payload.id??null,error:{code:-32601,message:'RPC method unavailable'}},{status:400});
  const upstream=await fetch('https://studio.genlayer.com/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(90000)});
  if(!upstream.ok) throw new Error('Studio RPC is temporarily unavailable');
  return new Response(await upstream.text(),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 } catch {return NextResponse.json({jsonrpc:'2.0',id:null,error:{code:-32000,message:'Studio RPC is temporarily unavailable. Check a submitted transaction before retrying.'}},{status:502});}
}
