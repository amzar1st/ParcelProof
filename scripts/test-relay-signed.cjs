const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),ts=require('typescript');
const folder=path.resolve('.sites-runtime/relay-signed');fs.mkdirSync(folder,{recursive:true});
for(const [source,out] of [['app/api/rpc/route.ts','route.cjs'],['lib/parcelproof.ts','parcelproof.cjs']])fs.writeFileSync(path.join(folder,out),ts.transpileModule(fs.readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText);
fs.copyFileSync('lib/deployment.json',path.join(folder,'deployment.json'));
const {POST}=require(path.join(folder,'route.cjs'));const methods=new Set();
const server=http.createServer(async(req,res)=>{try{let body='';for await(const chunk of req)body+=chunk;const payload=JSON.parse(body);for(const item of Array.isArray(payload)?payload:[payload])methods.add(item.method);const r=await POST(new Request('http://test/api/rpc',{method:'POST',body,headers:{'Content-Type':'application/json'}}));res.writeHead(r.status,Object.fromEntries(r.headers));res.end(await r.text())}catch{res.writeHead(500);res.end('{}')}});
server.listen(0,'127.0.0.1',async()=>{
 try {
  const origin='http://127.0.0.1:'+server.address().port;global.window={location:{origin}};
  const storage=new Map();global.sessionStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
  const {sessionWallets,studioClient,fundStudio,sendWrite,readOrder,readResult,sha256,parseAmount}=require(path.join(folder,'parcelproof.cjs'));
  const [buyer,seller]=sessionWallets();const client=studioClient(buyer);
  await fundStudio(buyer);await fundStudio(seller);
  const id='parcelproof-relay-'+Date.now();const destination='Colombo 00700';
  const proof={scope:'Actual Node HTTP relay + frontend helpers + ephemeral Studio wallet signing; not browser UI testing',contract:require(path.join(folder,'deployment.json')).address,network:'Studio sandbox; simulated GEN',order_id:id,buyer:buyer.address,seller:seller.address,transactions:[]};
  const save=()=>fs.writeFileSync('docs/relay-signed-proof.json',JSON.stringify({...proof,rpc_methods:[...methods].sort()},(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
  async function write(method,args,value=0n){const entry={method,args};const r=await sendWrite(client,method,args,value,hash=>{entry.hash=hash;proof.transactions.push(entry);save();console.log(method+' submitted '+hash)});entry.receipt=r;save();console.log(method+' FINALIZED SUCCESS')}
  await write('create_order',[id,seller.address,'Signed frontend relay test, one simulated wei','PP-RELAY-001',await sha256(destination),destination,'UPS','https://www.ups.com/track?tracknum=PP-RELAY-001','https://www.ups.com/proof/PP-RELAY-001',Math.floor(Date.now()/1000)+900,120,120,120,60,'BUYER_REFUND','',''],parseAmount('0.000000000000000001'));
  let order=await readOrder(id);assert.equal(order.amount,'1');assert.equal(order.status,'OPEN');
  await write('cancel_order',[id]);await write('claim_buyer_refund',[id]);
  order=await readOrder(id);const result=await readResult(id);assert.equal(order.status,'CLAIMED');assert.equal(result.beneficiary,buyer.address.toLowerCase());assert.equal(order.amount,'1');
  proof.final_order=order;proof.result=result;proof.completed_at=new Date().toISOString();save();
  console.log('PASS signed Create / Cancel / Refund through the actual frontend relay helpers');
 }catch(error){console.error(error);process.exitCode=1}finally{server.close()}
});
