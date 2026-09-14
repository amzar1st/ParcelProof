import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient,createAccount,generatePrivateKey} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {TransactionStatus,TransactionHashVariant} from 'genlayer-js/types';
const deployment=JSON.parse(fs.readFileSync('lib/deployment.json','utf8'));
const secretPath='.sites-runtime/live-wallets.json';
const keys=fs.existsSync(secretPath)?JSON.parse(fs.readFileSync(secretPath,'utf8')):{buyer:generatePrivateKey(),seller:generatePrivateKey()};
fs.writeFileSync(secretPath,JSON.stringify(keys),{mode:0o600});
const buyer=createAccount(keys.buyer),seller=createAccount(keys.seller);
const b=createClient({chain:studionet,account:buyer}),s=createClient({chain:studionet,account:seller});
const proofPath='docs/live-proof.json';
const proof=fs.existsSync(proofPath)?JSON.parse(fs.readFileSync(proofPath,'utf8')):{deployment,network:'Studio sandbox, simulated GEN',buyer:buyer.address,seller:seller.address,transactions:[],orders:{}};
function save(){fs.writeFileSync(proofPath,JSON.stringify(proof,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n')}
function success(r){
 if(r.status_name!=='FINALIZED'&&r.statusName!=='FINALIZED'&&String(r.status)!=='7')throw new Error('Not finalized');
 if(r.txExecutionResultName==='FINISHED_WITH_RETURN'||r.txExecutionResult===1)return;
 if(r.consensus_data?.leader_receipt?.[0]?.execution_result==='SUCCESS')return;
 throw new Error('Execution failed: '+JSON.stringify(r));
}
async function read(id){const o=JSON.parse(await b.readContract({address:deployment.address,functionName:'get_order',args:[id],transactionHashVariant:TransactionHashVariant.LATEST_FINAL}));proof.orders[id]=o;save();return o}
async function write(label,client,method,args,value=0n){
 const previous=proof.transactions.find(t=>t.label===label);
 if(previous?.receipt){success(previous.receipt);console.log(label+': already finalized');return previous.receipt}
 let tx=previous;
 if(!tx){const hash=await client.writeContract({address:deployment.address,functionName:method,args,value});tx={label,method,args,hash};proof.transactions.push(tx);save();console.log(label+': submitted '+hash)}
 const receipt=await client.waitForTransactionReceipt({hash:tx.hash,status:TransactionStatus.FINALIZED,retries:120,interval:3000});tx.receipt=receipt;save();success(receipt);console.log(label+': FINALIZED SUCCESS');return receipt;
}
await b.request({method:'sim_fundAccount',params:[buyer.address,10000000000000000000]});
await s.request({method:'sim_fundAccount',params:[seller.address,10000000000000000000]});
const deployReceipt=await b.getTransaction({hash:deployment.deployment_transaction});proof.deployment_receipt=deployReceipt;success(deployReceipt);save();console.log('Deployment FINALIZED SUCCESS');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const destination='Colombo 00700';
const source1='https://www.ups.com/track?tracknum=PP-STUDIO-001';const source2='https://www.ups.com/proof/PP-STUDIO-001';
function args(id,deadline,challenge=120,retry=60){return[id,seller.address,'Studio test order; not a real shipment','PP-STUDIO-001',sha(destination),destination,'UPS',source1,source2,deadline,120,120,challenge,retry,'BUYER_REFUND','','']}
const ids=proof.ids??{paid:'parcelproof-paid-001',cancel:'parcelproof-cancel-001',dispute:'parcelproof-review-001'};proof.ids=ids;save();
await write('paid/create',b,'create_order',args(ids.paid,Math.floor(Date.now()/1000)+900),1000000000000000n);
let o=await read(ids.paid);await write('paid/accept',s,'accept_order',[ids.paid,o.terms_hash]);
await write('paid/ship',s,'mark_shipped',[ids.paid,'PP-STUDIO-001']);
await write('paid/confirm',b,'confirm_delivery',[ids.paid]);
await write('paid/claim',s,'claim_seller_payment',[ids.paid]);await read(ids.paid);
await write('cancel/create',b,'create_order',args(ids.cancel,Math.floor(Date.now()/1000)+900),1000000000000000n);
await write('cancel/cancel',b,'cancel_order',[ids.cancel]);
await write('cancel/refund',b,'claim_buyer_refund',[ids.cancel]);await read(ids.cancel);
await write('dispute/create',b,'create_order',args(ids.dispute,Math.floor(Date.now()/1000)+300),1000000000000000n);
o=await read(ids.dispute);await write('dispute/accept',s,'accept_order',[ids.dispute,o.terms_hash]);
await write('dispute/ship',s,'mark_shipped',[ids.dispute,'PP-STUDIO-001']);
await write('dispute/open',b,'open_dispute',[ids.dispute,'Carrier evidence does not identify this synthetic shipment']);
const note='Synthetic seller note; does not prove delivery';
const counter='Synthetic buyer statement: parcel not received';
// Independent parties may sign concurrently. Each receipt must still finalize.
await Promise.all([
 write('dispute/seller-evidence',s,'submit_evidence',[ids.dispute,note,sha(note)]),
 write('dispute/buyer-evidence',b,'submit_counter_evidence',[ids.dispute,counter,sha(counter)]),
]);
o=await read(ids.dispute);
if(o.seller_evidence.length!==1||o.buyer_evidence.length!==1)throw new Error('Two-sided committed evidence missing from finalized state');
console.log('Dispute evidence closes: '+new Date(o.evidence_close*1000).toISOString());
const eligible=Math.max(o.evidence_close,o.delivery_deadline);
while(Date.now()/1000<eligible){console.log('Waiting for contract adjudication deadline; remaining seconds '+Math.ceil(eligible-Date.now()/1000));await new Promise(r=>setTimeout(r,Math.min(30000,(eligible-Date.now()/1000)*1000)))}
await write('dispute/resolve',b,'resolve_dispute',[ids.dispute]);o=await read(ids.dispute);
if(o.status!=='EVIDENCE_REVIEW')throw new Error('Expected protected EVIDENCE_REVIEW for unavailable shipment evidence');
await write('dispute/retry',b,'resolve_dispute',[ids.dispute]);o=await read(ids.dispute);
while(Date.now()/1000<o.terminal_at){console.log('Waiting for fixed refund deadline; remaining seconds '+Math.ceil(o.terminal_at-Date.now()/1000));await new Promise(r=>setTimeout(r,Math.min(30000,(o.terminal_at-Date.now()/1000)*1000)))}
await write('dispute/timeout',b,'resolve_timeout',[ids.dispute]);
await write('dispute/refund',b,'claim_buyer_refund',[ids.dispute]);await read(ids.dispute);
// Recover the earlier short-window case after the main workflow is done.
if(proof.short_window_order_id){
 await write('short-window/timeout',b,'resolve_timeout',[proof.short_window_order_id]);
 await write('short-window/refund',b,'claim_buyer_refund',[proof.short_window_order_id]);
 await read(proof.short_window_order_id);
}
proof.accounting=JSON.parse(await b.readContract({address:deployment.address,functionName:'get_accounting',args:[],transactionHashVariant:TransactionHashVariant.LATEST_FINAL}));
const a=proof.accounting;if(BigInt(a.deposited)!==BigInt(a.locked)+BigInt(a.claimable)+BigInt(a.emitted))throw new Error('Accounting mismatch');
proof.completed_at=new Date().toISOString();save();console.log('ALL LIVE SANDBOX WORKFLOWS PASSED');
