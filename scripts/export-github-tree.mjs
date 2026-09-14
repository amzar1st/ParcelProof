import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// Export repository source and public verification records, never ignored keys/builds.
const files=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{encoding:'utf8'}).split('\0').filter(Boolean);
const executable=new Set(['scripts/build-verified.sh','scripts/install-ci.sh','scripts/install-pnpm.sh','scripts/sites-env.sh']);
const entries=[];
for(const path of [...new Set(files)].sort()) {
 if(!fs.existsSync(path))continue;
 const data=fs.readFileSync(path);
 // Existing image blobs stay unchanged in the base GitHub tree.
 if(data.includes(0))continue;
 entries.push({path,mode:executable.has(path)?'100755':'100644',type:'blob',content:data.toString('utf8')});
}
fs.mkdirSync('.sites-runtime',{recursive:true});
const serialized=JSON.stringify(entries);
fs.writeFileSync('.sites-runtime/github-final-tree.json',serialized);
console.log(JSON.stringify({files:entries.length,characters:serialized.length}));
