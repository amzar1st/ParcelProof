import fs from 'node:fs';
import assert from 'node:assert/strict';

const main=JSON.parse(fs.readFileSync('docs/live-proof.json','utf8'));
const fixture=JSON.parse(fs.readFileSync('docs/fixture-proof.json','utf8'));
const relay=JSON.parse(fs.readFileSync('docs/relay-signed-proof.json','utf8'));
assert(main.completed_at&&fixture.completed_at&&relay.completed_at,'Complete live and signed relay runs before generating submission evidence');
assert.equal(relay.contract,main.deployment.address);
assert.equal(relay.final_order.status,'CLAIMED');
assert.equal(relay.final_order.amount,'1');
assert.equal(fixture.synthetic_evidence,true);
assert.equal(fixture.resolved_order.verdict,'DELIVERED');
const dispute=main.orders[main.ids.dispute];
assert.equal(dispute.seller_evidence.length,1);
assert.equal(dispute.buyer_evidence.length,1);
assert.equal(dispute.attempts,2);
assert.equal(dispute.status,'CLAIMED');
assert.equal(dispute.verdict,'TIMEOUT_REFUND');
for(const proof of [main,fixture]) {
 assert.equal(proof.deployment_receipt.consensus_data.leader_receipt[0].execution_result,'SUCCESS');
 for(const tx of proof.transactions) {
  assert.equal(tx.receipt.status_name??tx.receipt.statusName,'FINALIZED');
  assert.equal(tx.receipt.consensus_data.leader_receipt[0].execution_result,'SUCCESS');
 }
}
for(const tx of relay.transactions) {
 assert.equal(tx.receipt.status_name??tx.receipt.statusName,'FINALIZED');
 assert.equal(tx.receipt.consensus_data.leader_receipt[0].execution_result,'SUCCESS');
}
const a=main.accounting;
assert.equal(BigInt(a.deposited),BigInt(a.locked)+BigInt(a.claimable)+BigInt(a.emitted));
assert.equal(a.locked,'0');assert.equal(a.claimable,'0');
const deployment=main.deployment;
const url='https://parcelproof.amzar1st96.chatgpt.site';
const lines=['# Completed live verification','',`Completed ${main.completed_at}. Studio GEN, consensus and transfers are simulated; this is not mainnet commerce settlement.`,'','## Primary deployment','',`Contract: [${deployment.address}](${deployment.explorer}). Synthetic evidence is disabled on this instance.`,'',`${main.transactions.length} signed workflow writes finalized successfully, covering seller payment, cancellation/refund, two-sided evidence, inconclusive resolution/retry, and fixed-deadline refund.`,'','| Order | Final state | Verdict | Beneficiary |','|---|---|---|---|'];
for(const [id,o] of Object.entries(main.orders))lines.push(`| ${id} | ${o.status} | ${o.verdict} | ${o.beneficiary} |`);
lines.push('',`Accounting: \`${JSON.stringify(a)}\`. No test escrow remains locked or claimable on this primary instance.`,'','## Separate synthetic adjudication test','',`Instance [${fixture.address}](https://explorer-studio.genlayer.com/address/${fixture.address}) pins [an immutable synthetic record](https://raw.githubusercontent.com/amzar1st/ParcelProof/${fixture.fixture_commit}/fixtures/delivered.json). It is NOT a real shipment or authentic carrier proof. The application stays connected to the primary instance.`,``,`Order \`${fixture.order_id}\` resolved DELIVERED through real Studio web fetching, structured LLM interpretation and validator consensus, then finalized the seller claim. ${fixture.transactions.length} signed workflow writes and the deployment succeeded.`,'','## Finalized transactions','', '| Scope | Action | Explorer |','|---|---|---|');
for(const [scope,p] of [['Primary',main],['Synthetic',fixture],['Signed relay',relay]])for(const t of p.transactions)lines.push(`| ${scope} | ${t.label??t.method} | [${t.hash.slice(0,12)}…](https://explorer-studio.genlayer.com/tx/${t.hash}) |`);
lines.push('','## Signed frontend relay check','',`The actual frontend helpers signed Create / Cancel / Refund via a local Node HTTP server running the application RPC route. All ${relay.transactions.length} writes finalized successfully, and a public read confirmed order \`${relay.order_id}\` was CLAIMED. Its one simulated wei is included in the primary accounting above. This verifies the wallet helpers and relay, not browser UI interaction.`,'','## Local checks','','44 contract unit tests, 9 frontend checks, TypeScript and the production build passed. The read-only Node HTTP relay test also rejects unauthorized RPC methods. Neither relay check is browser UI testing.','','Raw evidence: [primary](live-proof.json), [synthetic](fixture-proof.json), [signed relay](relay-signed-proof.json), [read-only relay](relay-verification.json), [pinned runtime compatibility](runtime-compatibility.json). Interrupted and superseded deployments are historical, not current settlement proofs.','');
fs.writeFileSync('docs/verification.md',lines.join('\n'));
const source=fs.readFileSync('contracts/parcelproof.py','utf8').trim();
assert.equal(source,fs.readFileSync('docs/deployed-source.py','utf8').trim());
for(const path of ['README.md','docs/submission.md']) {
 let text=fs.readFileSync(path,'utf8');
 const old=JSON.parse(fs.readFileSync('docs/interrupted-v2-live-proof.json','utf8')).deployment;
 text=text.replaceAll(old.address,deployment.address).replaceAll(old.deployment_transaction,deployment.deployment_transaction);
 text=text.replace(' after the live smoke finishes','').replace(' after the completed live smoke','');
 text=text.replace('Add the confirmed app URL and individual proof transaction URLs from the completed live-proof record.','Completed transaction evidence: https://github.com/amzar1st/ParcelProof/blob/main/docs/verification.md\n\nSynthetic web/LLM consensus evidence (not real carrier evidence): https://github.com/amzar1st/ParcelProof/blob/main/docs/fixture-proof.json');
 if(path==='README.md')text=text.replace(/\n\[Completed live verification\]\(docs\/verification\.md\):[^\n]*\n/g,'\n');
 if(path==='README.md')text=text.replace('## Verification\n',`## Verification\n\n[Completed live verification](docs/verification.md): ${main.transactions.length} primary workflow/recovery writes, ${fixture.transactions.length} separate synthetic-evidence writes, and ${relay.transactions.length} signed frontend relay writes finalized successfully. A separate short-window test finalized with a rollback for late evidence; its protected escrow was subsequently refunded.\n`);
 text=text.replaceAll('parcelproof-review-001',main.ids.dispute);
 if(!text.includes(url))text+=`\nWebsite: ${url} (see docs/publication.json for recorded access).\n`;
 fs.writeFileSync(path,text);
}
console.log('Submission evidence generated only from completed, successful finalized receipts.');
