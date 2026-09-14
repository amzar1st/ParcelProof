import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
if(!process.env.PARCELPROOF_BROWSER_PACKAGE_DIR)throw Error('Set PARCELPROOF_BROWSER_PACKAGE_DIR to the isolated Playwright installation');
const {chromium}=createRequire(path.resolve(process.env.PARCELPROOF_BROWSER_PACKAGE_DIR,'package.json'))('playwright');
const base='http://localhost:5173';
fs.mkdirSync('outputs',{recursive:true});
const log=fs.createWriteStream('outputs/browser-server.log');
const server=spawn(process.execPath,['scripts/run-framework.mjs','dev'],{detached:true,stdio:['ignore','pipe','pipe']});
server.stdout.pipe(log);server.stderr.pipe(log);
const proof={scope:'Desktop/mobile Chromium against local preview. Finalized reads use real Studio RPC. Faucet responses mocked only for wallet-selector UI. No escrow writes or browser-wallet signatures.',checks:[],viewports:[],errors:[]};
let browser;
async function check(name,fn){await fn();proof.checks.push({name,passed:true});console.log('PASS '+name)}
try{
 const deadline=Date.now()+120000;
 while(true){if(server.exitCode!==null)throw Error('Preview exited before ready');try{if((await fetch(base,{signal:AbortSignal.timeout(2000)})).ok)break}catch{}if(Date.now()>deadline)throw Error('Preview startup timed out');await new Promise(r=>setTimeout(r,1000))}
 browser=await chromium.launch({headless:true});
 for(const [name,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport});const page=await context.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>proof.errors.push({viewport:name,message:e.message}));
  await page.route('**/api/rpc',async route=>{const p=route.request().postDataJSON();if(p?.method==='sim_fundAccount')await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:p.id,result:null})});else await route.continue()});
  await page.goto(base,{waitUntil:'networkidle',timeout:120000});
  assert.deepEqual(proof.errors,[],'Client-side boot errors');
  await check(name+'/renders five tabs',async()=>{await page.getByRole('heading',{level:1}).waitFor();assert.equal(await page.getByRole('tab').count(),5)});
  await page.getByRole('button',{name:'Connect wallet',exact:true}).click();
  await check(name+'/missing wallet error',async()=>{await page.getByRole('alert').filter({hasText:'No browser wallet found'}).waitFor()});
  async function read(id){await page.getByLabel('Order ID',{exact:true}).fill(id);await page.getByRole('button',{name:'Read finalized order',exact:true}).click()}
  await read('parcelproof-paid-001');
  await check(name+'/live finalized claim',async()=>{await page.getByRole('status').filter({hasText:'Latest finalized order loaded.'}).waitFor({timeout:120000});await page.getByText('CLAIMED',{exact:true}).waitFor()});
  for(const [tab,title] of [['Buyer','Create a protected order'],['Seller','Ship the agreed order'],['Dispute','Let evidence decide'],['Evidence','One record. Both sides.'],['Finalized result','Settlement, in the open']]){
   await page.getByRole('tab',{name:tab,exact:true}).click();await check(name+'/tab '+tab,async()=>{await page.getByRole('heading',{name:title,exact:true}).waitFor()});
  }
  await check(name+'/finalized result',async()=>{const result=JSON.parse(await page.locator('pre').first().textContent());assert.equal(result.claimed,true);assert.equal(result.verdict,'DELIVERED')});
  await read('parcelproof-no-such-order-'+Date.now());
  await check(name+'/failed read clears stale state',async()=>{await page.getByRole('alert').waitFor({timeout:120000});await page.getByText('No order loaded',{exact:true}).waitFor();await page.getByText('Read an order to inspect its finalized verdict, beneficiary, and claim status.',{exact:true}).waitFor()});
  await read('parcelproof-paid-001');await page.getByRole('status').filter({hasText:'Latest finalized order loaded.'}).waitFor({timeout:120000});
  await page.getByRole('button',{name:'Use Studio test wallets',exact:true}).click();
  await check(name+'/test wallet selector',async()=>{await page.getByRole('status').filter({hasText:'Studio Buyer and Seller wallets are ready'}).waitFor();await page.getByRole('combobox').first().waitFor()});
  await page.getByRole('tab',{name:'Buyer',exact:true}).click();
  await check(name+'/wallet enables create without submitting',async()=>{assert.equal(await page.getByRole('button',{name:'Fund escrow & create order',exact:true}).isEnabled(),true)});
  await check(name+'/source download',async()=>{const r=await page.request.get(base+'/contracts/parcelproof.py');assert.equal(r.status(),200);assert.equal((await r.text()).trim(),fs.readFileSync('contracts/parcelproof.py','utf8').trim())});
  await check(name+'/no horizontal overflow',async()=>{assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true)});
  await page.screenshot({path:'outputs/browser-'+name+'.png',fullPage:true});proof.viewports.push({name,...viewport});await context.close();
 }
 assert.deepEqual(proof.errors,[]);proof.completed_at=new Date().toISOString();console.log('PASS browser smoke: '+proof.checks.length);
}catch(e){proof.failure=e.message;process.exitCode=1;console.error(e);console.error('BROWSER_DIAGNOSTICS '+JSON.stringify(proof))}
finally{console.log('BROWSER_PROOF '+JSON.stringify(proof));fs.writeFileSync('outputs/browser-proof.json',JSON.stringify(proof,null,2)+'\n');if(browser)await browser.close();try{process.kill(-server.pid,'SIGTERM')}catch{}log.end()}
