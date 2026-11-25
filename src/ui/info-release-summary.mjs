// View-only release acknowledgement. Read from the history already shipped with
// this app build; the separate unreleased section is never a summary source.
export const RELEASE_READ_PREFIX='crystal-forge-info-read-v1:';
export const releaseReadKey=version=>RELEASE_READ_PREFIX+version;
// Categories are editorial metadata in release notes, never inferred from wording.
export function splitReleaseNote(note){
 const match=note.match(/^(New|Changed|Moved|Fixed|Important) — (.+)$/);
 return match?{category:match[1],text:match[2]}:{category:null,text:note};
}
export function unreadReleaseEntries(entries,storage){
 if(!entries.length)return {entries:[],available:false,previous:null};
 try{
  if(!storage)throw Error('Storage unavailable');
  const first=entries.findIndex(entry=>storage.getItem(releaseReadKey(entry.version))==='read');
  return {entries:first<0?entries.slice(0,1):entries.slice(0,first),available:true,previous:first<0?null:entries[first].version};
 }catch{return {entries:entries.slice(0,1),available:false,previous:null};}
}
function releaseEntry(root,heading,versionPattern=/^v(\d+\.\d+\.\d+(?:-[\w.]+)?) — (.+)$/){
 const match=heading?.textContent.trim().match(versionPattern);
 if(!match)return null;
 return {version:match[1],title:match[2],notes:[...root.querySelectorAll(':scope > ul > li')].map(el=>el.textContent.trim())};
}
export function installInfoReleaseSummary(doc=document){
 const root=doc.getElementById('infoReleaseSummary'),trigger=doc.getElementById('helpBtn');
 const current=doc.getElementById('currentRelease');
 if(!root||!trigger||!current)return;
 const latest=releaseEntry(current,current.querySelector(':scope > strong'));
 // Never infer a deployed version from draft notes or a remote request.
 if(!latest||doc.querySelector('.version')?.textContent.trim()!=='v'+latest.version)return;
 const entries=[latest,...[...doc.querySelectorAll('#infoChangelog .release-archive > details.release')].map(el=>releaseEntry(el,el.querySelector(':scope > summary'))).filter(Boolean)];
 const heading=doc.getElementById('infoReleaseSummaryHeading'),status=doc.getElementById('infoReleaseSummaryStatus');
 const list=doc.getElementById('infoReleaseSummaryList'),ack=doc.getElementById('ackReleaseRead'),notice=doc.getElementById('infoReleaseNotice');
 let storage;
 try{storage=doc.defaultView.localStorage}catch{}
 function render(){
  const state=unreadReleaseEntries(entries,storage);
  const unread=state.entries.length>0;
  trigger.toggleAttribute('data-info-unread',unread);
  notice.textContent=unread?'Version notes not yet marked as read.':'Version notes marked as read.';
  heading.textContent=state.previous&&unread?'Changes since your last acknowledgement':unread?'Highlights of this version':'You’re up to date with this version';
  status.textContent=!state.available?'Read preferences cannot be accessed in this browser.':state.previous&&unread?'Previously marked as read: v'+state.previous+'.':unread?'New here, or no previous read marker is available. You can review the complete history below.':'You can still browse the release history below.';
  const restoreFocus=!unread&&doc.activeElement===ack;
  ack.hidden=!unread;
  ack.disabled=!state.available;
  list.replaceChildren();
  for(const entry of state.entries){
   const item=doc.createElement('li');
   const title=doc.createElement('strong');title.textContent='v'+entry.version+' — '+entry.title;
   const notes=doc.createElement('ul');
   for(const note of entry.notes){
    const line=doc.createElement('li'),{category,text}=splitReleaseNote(note);
    if(category){const label=doc.createElement('strong');label.textContent=category+' — ';line.append(label);}
    line.append(doc.createTextNode(text));notes.append(line);
   }
   item.append(title,notes);list.append(item);
  }
  root.hidden=false;
  if(restoreFocus)heading.focus();
 }
 ack.addEventListener('click',()=>{
  try{
   storage.setItem(releaseReadKey(latest.version),'read');
   if(storage.getItem(releaseReadKey(latest.version))!=='read')throw Error('Read marker was not saved');
   render();heading.focus();
  }catch{status.textContent='Could not save your read preference. The version notes remain unread.';}
 });
 doc.defaultView.addEventListener('storage',event=>{
  if(event.key===null||event.key?.startsWith(RELEASE_READ_PREFIX))render();
 });
 render();
}
