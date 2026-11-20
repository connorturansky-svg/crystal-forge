import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cp,mkdir,mkdtemp,readFile,readdir,rename,rm,stat,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename,join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const SHA=/^[a-f0-9]{40}$/i;
const MAX_PREVIOUS=5;
const VENDOR_NAMES=['three','manifold-3d'];
function sha(value){
 if(!SHA.test(value||''))throw Error('Expected an exact 40-character Git commit SHA.');
 return value.toLowerCase();
}
const version=(pkg,name)=>pkg.dependencies?.[name]||pkg.devDependencies?.[name];
const readPackage=async dir=>JSON.parse(await readFile(join(dir,'package.json'),'utf8'));
const exists=async file=>{const info=await stat(file);assert(info.isFile()&&info.size>0,'Missing release file '+file);};

/**
 * Stage one immutable older Crystal Forge release alongside the current one.
 * Safe for a newly assembled _site; never modify an existing SHA directory.
 * 'sourceRoot' must be an extracted TRUSTED Git tree for 'oldSha'.
 */
export async function preserveRelease({sourceRoot,siteRoot,oldSha,currentSha}){
 oldSha=sha(oldSha);currentSha=sha(currentSha);
 if(oldSha===currentSha)throw Error('Previous and current release cannot be the same commit.');
 sourceRoot=resolve(sourceRoot);siteRoot=resolve(siteRoot);
 const current=join(siteRoot,'releases',currentSha),destination=join(siteRoot,'releases',oldSha);
 const [previousPkg,currentPkg]=await Promise.all([readPackage(sourceRoot),readPackage(siteRoot)]);
 for(const name of VENDOR_NAMES){
  if(version(previousPkg,name)!==version(currentPkg,name))
   throw Error('Cannot reconstruct '+oldSha+': '+name+' was updated. The exact old vendor bundle must be retained, not substituted.');
 }
 await exists(join(current,'vendor','three','build','three.module.js'));
 await exists(join(current,'vendor','manifold','manifold.wasm'));
 try{await stat(destination);throw Error('Historical release already exists: '+oldSha);}
 catch(error){if(error.code!=='ENOENT')throw error;}
 const staging=join(siteRoot,'releases','.staging-'+oldSha);
 try{
  await mkdir(staging,{recursive:false});
  let copied=0;
  for(const entry of await readdir(sourceRoot,{withFileTypes:true})){
   if(!entry.isFile()||!/\.(?:js|css)$/i.test(entry.name))continue;
   const source=join(sourceRoot,entry.name),target=join(staging,entry.name);
   if(entry.name.endsWith('.js')){
    // Match the existing Pages workflow's per-revision same-origin rewrite.
    const body=(await readFile(source,'utf8'))
     .replaceAll('https://cdn.jsdelivr.net/npm/three@0.165.0/','./vendor/three/')
     .replaceAll('https://cdn.jsdelivr.net/npm/manifold-3d@3.5.4/','./vendor/manifold/');
    await writeFile(target,body);
   }else await cp(source,target);
   copied++;
  }
  if(copied<10)throw Error('Old release contains too few app modules; refusing incomplete snapshot.');
  await cp(join(sourceRoot,'svg-import'),join(staging,'svg-import'),{recursive:true});
  await cp(join(current,'vendor'),join(staging,'vendor'),{recursive:true});
  for(const path of ['studio-v3.js','fabrication-worker.js','svg-import/index.js',
   'vendor/three/build/three.module.js','vendor/manifold/manifold.wasm'])await exists(join(staging,path));
  await rename(staging,destination);
  return {sha:oldSha,files:copied};
 }catch(error){
  await rm(staging,{recursive:true,force:true});
  throw error;
 }
}

/** The oldest supported tab is bounded by maxPrevious completed main commits. */
export function previousCommits({currentSha,keep=3,repoRoot=process.cwd()}){
 currentSha=sha(currentSha);
 if(!Number.isInteger(keep)||keep<1||keep>MAX_PREVIOUS)throw Error('Keep must be 1–'+MAX_PREVIOUS+' previous commits.');
 const list=execFileSync('git',['rev-list','--first-parent','--max-count='+String(keep+1),currentSha],
  {cwd:repoRoot,encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
 if(list[0]!==currentSha)throw Error('Current SHA is not a readable commit.');
 return list.slice(1).map(sha);
}

export async function stageHistoricalReleases({siteRoot,currentSha,commits,repoRoot=process.cwd()}){
 currentSha=sha(currentSha);
 const done=[];
 for(const commit of [...new Set(commits.map(sha))]){
  if(commit===currentSha)continue;
  const extracted=await mkdtemp(join(tmpdir(),'crystal-forge-release-'));
  try{
   // Repository history is trusted. This does NOT download or execute old JS.
   const archive=execFileSync('git',['archive','--format=tar',commit],
    {cwd:repoRoot,maxBuffer:100*1024*1024});
   execFileSync('tar',['-xf','-','-C',extracted],{input:archive,maxBuffer:1024*1024});
   done.push(await preserveRelease({sourceRoot:extracted,siteRoot,oldSha:commit,currentSha}));
  }finally{await rm(extracted,{recursive:true,force:true});}
 }
 return done;
}

async function cli(){
 const [, ,root,commit,keepFlag]=process.argv;
 if(!root||!commit)throw Error('Usage: node scripts/retain-pages-releases.mjs _site EXACT_COMMIT_SHA [--keep=3]');
 const keep=keepFlag?Number(keepFlag.match(/^--keep=(\d+)$/)?.[1]):3;
 const commits=previousCommits({currentSha:commit,keep});
 const stored=await stageHistoricalReleases({siteRoot:root,currentSha:commit,commits});
 console.log('Preserved historical SHA-scoped releases: '+stored.map(x=>x.sha.slice(0,12)).join(', '));
 console.log('Each old app tab can request the old workers and imports while its SHA is within the retention window.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 cli().catch(error=>{console.error(error.stack||String(error));process.exitCode=1;});
}
