// Session-only display model for the existing private GitHub backup flow.
// No token, repository URL, localStorage or network access.
const validSha=sha=>typeof sha==='string'&&/^[0-9a-f]{40}$/i.test(sha);
const validTime=time=>typeof time==='string'&&Number.isFinite(Date.parse(time));
export function backupStatus({connected=false,operation=null,localSaved=true,lastUpload=null,lastCheck=null,localDigest=null,conflict=false,failed=false}={}){
 if(!connected)return {kind:'local-only',label:localSaved?'Saved locally · not connected':'Local changes not saved',lastUpload:null,lastCheck:null};
 const receipt=lastUpload&&validSha(lastUpload.sha)&&validTime(lastUpload.at)&&typeof lastUpload.digest==='string'?{sha:lastUpload.sha,at:lastUpload.at,digest:lastUpload.digest}:null;
 const check=lastCheck&&validSha(lastCheck.sha)&&validTime(lastCheck.at)?{sha:lastCheck.sha,at:lastCheck.at}:null;
 const base={lastUpload:receipt?{sha:receipt.sha,at:receipt.at}:null,lastCheck:check};
 if(operation==='check')return {...base,kind:'checking',label:'Checking private backup'};
 if(operation==='upload')return {...base,kind:'uploading',label:'Uploading backup'};
 if(conflict||(receipt&&check&&check.sha!==receipt.sha&&Date.parse(check.at)>=Date.parse(receipt.at)))return {...base,kind:'review',label:'Remote backup changed · review before uploading'};
 if(failed)return {...base,kind:'failed',label:'Backup operation failed · retry'};
 if(!localSaved)return {...base,kind:'unsaved',label:'Local changes not saved'};
 if(receipt&&localDigest&&receipt.digest===localDigest)return {...base,kind:'confirmed-upload',label:'Current workspace matches last confirmed upload'};
 if(receipt)return {...base,kind:'local-edits',label:'Local changes since last confirmed upload'};
 if(check)return {...base,kind:'checked',label:'Private backup checked · upload not confirmed'};
 return {...base,kind:'connected',label:'Connected to private repository · backup not confirmed'};
}
