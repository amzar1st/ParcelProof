const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const folder=path.resolve('.sites-runtime/frontend-tests');fs.mkdirSync(folder,{recursive:true});
fs.copyFileSync('lib/deployment.json',path.join(folder,'deployment.json'));
fs.writeFileSync(path.join(folder,'parcelproof.cjs'),ts.transpileModule(fs.readFileSync('lib/parcelproof.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText);
const {assertFinalSuccess,parseAmount,formatAmount,sendWrite,timeAvailable}=require(path.join(folder,'parcelproof.cjs'));
const tests=[];function test(name,f){tests.push([name,f])}
test('GEN amount preserves the last wei',()=>assert.equal(parseAmount('1.000000000000000001'),1000000000000000001n));
test('No floating-point or invalid amounts',()=>{for(const x of ['0','-1','1e3','NaN','0.0000000000000000001'])assert.throws(()=>parseAmount(x))});
test('Amount round-trip preserves escrow value',()=>assert.equal(formatAmount(parseAmount('1234.123456789012345678').toString()),'1234.123456789012345678'));
test('Accepted status cannot report a successful finalized write',()=>assert.throws(()=>assertFinalSuccess({status:'6',consensus_data:{leader_receipt:[{execution_result:'SUCCESS'}]}})));
test('Finalized execution errors are rejected',()=>assert.throws(()=>assertFinalSuccess({status:'FINALIZED',consensus_data:{leader_receipt:[{execution_result:'ERROR'}]}})));
test('Finalized successful SDK and Studio receipts are accepted',()=>{assertFinalSuccess({status:'7',consensus_data:{leader_receipt:[{execution_result:'SUCCESS'}]}});assertFinalSuccess({statusName:'FINALIZED',txExecutionResultName:'FINISHED_WITH_RETURN'})});
test('Finalization timeouts submit only once',async()=>{let writes=0;const c={writeContract:async()=>{writes++;return '0xhash'},waitForTransactionReceipt:async()=>{throw new Error('Timeout')}};await assert.rejects(()=>sendWrite(c,'confirm_delivery',['o'],0n,()=>{}));assert.equal(writes,1)});
test('Wallet writes explicitly await FINALIZED receipts',async()=>{let requested;const c={writeContract:async()=> '0xhash',waitForTransactionReceipt:async args=>{requested=args.status;return{status:'FINALIZED',consensus_data:{leader_receipt:[{execution_result:'SUCCESS'}]}}}};await sendWrite(c,'confirm_delivery',['o'],0n,()=>{});assert.equal(requested,'FINALIZED')});
test('App exposes timeout recovery at the exact deadline',()=>{assert.equal(timeAvailable({status:'OPEN',accept_by:60},59),false);assert.equal(timeAvailable({status:'OPEN',accept_by:60},60),true);assert.equal(timeAvailable({status:'ACCEPTED',ship_by:90},90),true);assert.equal(timeAvailable({status:'EVIDENCE_REVIEW',terminal_at:100},100),true);assert.equal(timeAvailable({status:'CLAIMED',terminal_at:100},150),false)});
(async()=>{for(const[name,f]of tests){await f();console.log('PASS '+name)}console.log(tests.length+' frontend checks passed')})().catch(e=>{console.error(e);process.exitCode=1});
