/* Staged Pages historical-asset retention orchestrator (no publishing).
 * Builds on the isolated QA-R03 archive helper; never overwrites an
 * already staged SHA directory or changes saved projects.
 */
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {previousCommits,stageHistoricalReleases} from '../tests/helpers/retain-pages-releases.mjs';

const shaPattern=/^[a-f0-9]{40}$/i;
const repoPattern=/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
export function selectReleaseShas({currentSha,recent=[],lastSuccessful=null,isAncestor=()=>true}){
 if(!shaPattern.test(currentSha))throw Error('Expected current 40-character commit SHA.');
 const selected=[],ignored=[];
 for(const value of [...(lastSuccessful?[lastSuccessful]:[]),...recent]){
  if(!shaPattern.test(value)){ignored.push({sha:String(value),reason:'not a valid Git SHA'});continue;}
  const sha=value.toLowerCase();
  if(sha===currentSha.toLowerCase()||selected.includes(sha))continue;
  if(!isAncestor(sha)){ignored.push({sha,reason:'not an ancestor of this staged revision'});continue;}
  selected.push(sha);
 }
 return {selected,ignored};
}

async function githubJson(path,{repo,token,fetchFn}){
 const response=await fetchFn('https://api.github.com/repos/'+repo+path,{
  headers:{Accept:'application/vnd.github+json', ...(token?{Authorization:'Bearer '+token}:{})}
 });
 if(!response.ok)throw Error('GitHub deployment history HTTP '+response.status);
 return response.json();
}
export async function findLastSuccessfulPagesDeployment({repo,token='',fetchFn=fetch,currentSha=''}){
 if(!repoPattern.test(repo||''))throw Error('Expected an owner/repository name.');
 // Historical successes can now have an "inactive" latest status.
 // A prior successful record is still evidence the SHA really deployed.
 for(let page=1;page<=3;page++){
  const deployments=await githubJson('/deployments?environment=github-pages&per_page=40&page='+page,
   {repo,token,fetchFn});
  if(!Array.isArray(deployments))throw Error('Unexpected GitHub deployments response.');
  for(const d of deployments){
   if(!shaPattern.test(d.sha||'')||d.sha.toLowerCase()===currentSha.toLowerCase())continue;
   const statuses=await githubJson('/deployments/'+d.id+'/statuses?per_page=30',
    {repo,token,fetchFn});
   if(!Array.isArray(statuses))throw Error('Unexpected GitHub deployment statuses.');
   if(statuses.some(status=>status.state==='success'))return {
    sha:d.sha.toLowerCase(),deploymentId:d.id,
    wasSuccessful:true,latestState:statuses[0]?.state??null
   };
  }
  if(deployments.length<40)break;
 }
 return null;
}
function isGitAncestor({repoRoot,ancestor,currentSha}){
 try{execFileSync('git',['merge-base','--is-ancestor',ancestor,currentSha],
  {cwd:repoRoot,stdio:'ignore'});return true;}
 catch{return false;}
}
export async function stageRetainedPages({siteRoot,currentSha,repoRoot=process.cwd(),
 repo=process.env.GITHUB_REPOSITORY,token=process.env.GITHUB_TOKEN,
 fetchFn=fetch,keep=3}){
 if(!shaPattern.test(currentSha))throw Error('Exact current commit SHA is required.');
 const recent=previousCommits({currentSha,keep,repoRoot});
 let success=null,lookupWarning=null;
 if(repo){
  try{success=await findLastSuccessfulPagesDeployment({repo,token,fetchFn,currentSha});}
  catch(error){lookupWarning='Could not read GitHub deployment history: '+error.message;}
 }else lookupWarning='No GITHUB_REPOSITORY provided; retaining recent first-parent history only.';
 const {selected,ignored}=selectReleaseShas({currentSha,recent,lastSuccessful:success?.sha,
  isAncestor:ancestor=>isGitAncestor({repoRoot,ancestor,currentSha})});
 const staged=await stageHistoricalReleases({siteRoot:resolve(siteRoot),currentSha,
  commits:selected,repoRoot});
 return {currentSha,latestSuccess:success,lookupWarning,ignored,staged};
}
async function main(){
 const [, ,siteRoot='_site',currentSha=process.env.GITHUB_SHA,keepArg='--keep=3']=process.argv;
 if(!/^--keep=[1-5]$/.test(keepArg||''))throw Error('Specify --keep=1 to --keep=5.');
 const report=await stageRetainedPages({siteRoot,currentSha,keep:Number(keepArg.slice(-1))});
 console.log(JSON.stringify(report,null,2));
 if(report.lookupWarning)console.warn(report.lookupWarning);
 if(report.ignored.length)console.warn('Ignored historical SHAs:',report.ignored);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 main().catch(error=>{console.error(error.stack||String(error));process.exitCode=1;});
}
