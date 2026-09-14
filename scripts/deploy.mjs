import fs from 'node:fs';
import {createClient,createAccount,generatePrivateKey} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {TransactionStatus} from 'genlayer-js/types';

// Sandbox-only deployment. Wallet keys stay in ignored, checkout-local files.
fs.mkdirSync('.sites-runtime',{recursive:true,mode:0o700});
const walletPath='.sites-runtime/live-wallets.json';
const keys=fs.existsSync(walletPath)?JSON.parse(fs.readFileSync(walletPath,'utf8')):{buyer:generatePrivateKey(),seller:generatePrivateKey()};
fs.writeFileSync(walletPath,JSON.stringify(keys),{mode:0o600});
const buyer=createAccount(keys.buyer);
const client=createClient({chain:studionet,account:buyer});
await client.request({method:'sim_fundAccount',params:[buyer.address,10000000000000000000]});
const code=fs.readFileSync('contracts/parcelproof.py','utf8');
const hash=await client.deployContract({code,args:['']});
console.log('Studio sandbox deployment submitted:',hash);
const receipt=await client.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED,retries:120,interval:3000});
if(receipt.consensus_data?.leader_receipt?.[0]?.execution_result!=='SUCCESS')throw Error('Deployment execution failed');
const tx=await client.getTransaction({hash});
const deployment={address:tx.to_address,network:'studionet',rpc:'https://studio.genlayer.com/api',fixture_commit:'',explorer:'https://explorer-studio.genlayer.com/address/'+tx.to_address,deployment_transaction:hash};
const deployed=await client.getContractCode(deployment.address);
if(deployed.trim()!==code.trim())throw Error('Deployed source does not match');
fs.writeFileSync('lib/deployment.json',JSON.stringify(deployment,null,2)+'\n');
fs.writeFileSync('docs/deployed-source.py',deployed);
fs.writeFileSync('docs/contract-schema.json',JSON.stringify(await client.getContractSchema(deployment.address),null,2)+'\n');
console.log('FINALIZED SUCCESS; source verified:',deployment.address);
