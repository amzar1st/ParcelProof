import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant, TransactionStatus } from 'genlayer-js/types';
import deployment from './deployment.json';
import type { CalldataEncodable } from 'genlayer-js/types';

export type Order = {
 id:string; buyer:string; seller:string; amount:string; status:string; terms_hash:string;
 description:string; shipment_reference:string; recipient_commitment:string; recipient_hint:string;
 carrier:string; tracking_url:string; delivery_proof_url:string; delivery_deadline:number;
 accept_by:number; ship_by:number; evidence_close:number; terminal_at:number;
 challenge_seconds:number; retry_seconds:number; late_outcome:string; attempts:number;
 verdict:string; reason:string; beneficiary:string; claimed:boolean;
 seller_evidence:{text:string;sha256:string;submitted_at:number;author:string}[];
 buyer_evidence:{text:string;sha256:string;submitted_at:number;author:string}[];
 citations:string[]; settled_at:number;
};
export const config = deployment;
const rpcEndpoint=()=> typeof window==='undefined' ? config.rpc : window.location.origin+'/api/rpc';
export const readClient = () => createClient({chain:studionet,endpoint:rpcEndpoint()});
export type Client = ReturnType<typeof readClient>;
export type SessionWallet = {role:'buyer'|'seller';privateKey:`0x${string}`;address:`0x${string}`};
export type Provider = {request:(args:{method:string;params?:unknown[]})=>Promise<unknown>;on?:(event:string,cb:(...args:unknown[])=>void)=>void;removeListener?:(event:string,cb:(...args:unknown[])=>void)=>void};
export function address():`0x${string}` {
 if(!/^0x[0-9a-fA-F]{40}$/.test(config.address)) throw new Error('Contract deployment is not configured.');
 return config.address as `0x${string}`;
}
export async function readOrder(id:string):Promise<Order> {
 if(!id.trim()) throw new Error('Enter an order ID.');
 const value = await readClient().readContract({address:address(),functionName:'get_order',args:[id.trim()],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 if(typeof value !== 'string') throw new Error('Unexpected contract response.');
 const result=JSON.parse(value);
 if(result.id!==id.trim() || typeof result.status!=='string') throw new Error('Invalid finalized order response.');
 return result;
}
export async function readResult(id:string) {
 const value=await readClient().readContract({address:address(),functionName:'get_result',args:[id],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 if(typeof value!=='string') throw new Error('Unexpected result response.');
 return JSON.parse(value);
}
export async function sha256(text:string) {
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
export function parseAmount(value:string):bigint {
 if(!/^\d+(\.\d{1,18})?$/.test(value)) throw new Error('Enter a positive GEN amount with at most 18 decimals.');
 const [whole,fraction='']=value.split('.');
 const result=BigInt(whole)*BigInt('1000000000000000000')+BigInt(fraction.padEnd(18,'0'));
 if(result<=BigInt(0)) throw new Error('Escrow amount must be positive.');
 return result;
}
export function formatAmount(wei:string) {
 const amount=BigInt(wei); const scale=BigInt('1000000000000000000');
 const tail=(amount%scale).toString().padStart(18,'0').replace(/0+$/,'');
 return (amount/scale).toString()+(tail?'.'+tail:'');
}
export function assertFinalSuccess(receipt:Record<string,unknown>) {
 const status=receipt.status_name??receipt.statusName??receipt.status;
 if(status!=='FINALIZED'&&String(status)!=='7') throw new Error('The transaction has not finalized.');
 const execution=receipt.txExecutionResultName??receipt.txExecutionResult;
 const consensus=receipt.consensus_data as {leader_receipt?:{execution_result?:string;genvm_result?:unknown}[]}|undefined;
 const leader=consensus?.leader_receipt?.[0];
 const studioSuccess=leader?.execution_result==='SUCCESS';
 const networkSuccess=execution==='FINISHED_WITH_RETURN'||execution===1;
 if(!studioSuccess&&!networkSuccess) throw new Error('The transaction finalized with an execution error. Inspect the receipt before trying another action.');
}
export async function sendWrite(client:Client,method:string,args:CalldataEncodable[],value:bigint,onHash:(hash:string)=>void) {
 const hash=await client.writeContract({address:address(),functionName:method,args,value});
 onHash(hash);
 const receipt=await client.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED,interval:3000,retries:100});
 assertFinalSuccess(receipt as unknown as Record<string,unknown>);
 return receipt;
}
export function sessionWallets():SessionWallet[] {
 const stored=sessionStorage.getItem('parcelproof-studio-wallets');
 if(stored) return JSON.parse(stored);
 const wallets=(['buyer','seller'] as const).map(role=>{
  const random=crypto.getRandomValues(new Uint8Array(32));
  const privateKey=('0x'+Array.from(random,b=>b.toString(16).padStart(2,'0')).join('')) as `0x${string}`;
  return {role,privateKey,address:createAccount(privateKey).address};
 });
 sessionStorage.setItem('parcelproof-studio-wallets',JSON.stringify(wallets));
 return wallets;
}
export function studioClient(wallet:SessionWallet) {return createClient({chain:studionet,endpoint:rpcEndpoint(),account:createAccount(wallet.privateKey)});}
export async function fundStudio(wallet:SessionWallet) {
 // This RPC supplies simulated funds only; studionet is explicitly a sandbox chain.
 return studioClient(wallet).request({method:'sim_fundAccount',params:[wallet.address,10000000000000000000] } as never);
}
export function timeAvailable(o:Order,t:number) {
 return (o.status==='OPEN'&&t>=o.accept_by)||(o.status==='ACCEPTED'&&t>=o.ship_by)||(['SHIPPED','DISPUTED','EVIDENCE_REVIEW'].includes(o.status)&&t>=o.terminal_at);
}
