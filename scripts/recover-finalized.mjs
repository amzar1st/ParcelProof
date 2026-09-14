import fs from 'node:fs';
import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {TransactionHashVariant} from 'genlayer-js/types';

const client=createClient({chain:studionet});
const deployment=JSON.parse(fs.readFileSync('docs/interrupted-v2-live-proof.json','utf8')).deployment;
const fixture=JSON.parse(fs.readFileSync('docs/interrupted-v2-fixture-proof.json','utf8'));
const proof={checked_at:new Date().toISOString(),network:'Studio sandbox; simulated GEN',read_variant:'LATEST_FINAL',deployment,orders:{},receipts:{}};
const save=()=>fs.writeFileSync('docs/recovered-proof.json',JSON.stringify(proof,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
for(const [label,address,ids] of [
 ['primary',deployment.address,['parcelproof-paid-001','parcelproof-cancel-001','parcelproof-review-001']],
 ['synthetic','0xFff56203AB8FD7388684BfF88E76dBC3663b1E31',['parcelproof-synthetic-delivered-001']],
]) {
 proof.orders[label]={};
 for(const id of ids) {
  try {const o=JSON.parse(await client.readContract({address,functionName:'get_order',args:[id],transactionHashVariant:TransactionHashVariant.LATEST_FINAL}));proof.orders[label][id]=o;console.log(label,id,o.status,o.verdict,o.attempts);}
  catch(error){proof.orders[label][id]={error:String(error)};console.log(label,id,'read failed');}
  save();
 }
 proof[label+'_accounting']=JSON.parse(await client.readContract({address,functionName:'get_accounting',args:[],transactionHashVariant:TransactionHashVariant.LATEST_FINAL}));save();
}
for(const [label,hash] of [['deployment',deployment.deployment_transaction],['fixture_deployment',fixture.deployment_hash],['paid_create','0x1618ff894e28d7bd63731dcfcc6faa6d8450156a759244978751310d329054bd']]) {
 proof.receipts[label]=await client.getTransaction({hash});save();console.log(label,proof.receipts[label].statusName??proof.receipts[label].status_name??proof.receipts[label].status);
}
proof.completed_at=new Date().toISOString();save();
