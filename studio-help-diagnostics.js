function storageReadable(){
 try{return Number.isInteger(window.localStorage.length);}
 catch(error){
  if(error.name==='SecurityError')return false;
  throw error;
 }
}

const panel=document.getElementById('studioDiagnostics');
if(panel){
 const results=panel.querySelector('ul'),status=panel.querySelector('[role=status]'),download=panel.querySelector('a');
 let reportUrl;
 const printStatus=panel.querySelector('[data-print-check]');
 const openPrint=panel.querySelector('[data-open-print]');
 const currentJobs=()=>{
  const studio=window.__sensoryStudio,model=studio?.currentModel;
  return model?studio.project.printJobs.filter(job=>job.modelId===model.id):null;
 };
 panel.querySelector('[data-check-print]').addEventListener('click',()=>{
  const jobs=currentJobs();
  const has=status=>jobs?.some(job=>job.status===status);
  const messages=[];
  if(!jobs)messages.push('Open a model in Studio before checking its print jobs.');
  else if(!jobs.length)messages.push('This model has no print jobs. Open Build and send it to Print Centre first.');
  if(has('preparing'))messages.push('Preparation is still running. In Print Centre you can check progress or cancel.');
  if(has('failed')||has('cancelled'))messages.push('A preparation failed or was cancelled. Read the job message, then choose Retry in Print Centre.');
  if(has('queued')||has('stale'))messages.push('Prepare the current revision in Print Centre before attempting a download.');
  if(has('prepared'))messages.push('A job is marked prepared. Check whether its download buttons are enabled in Print Centre. If a download is missing, check your browser’s downloads list and permissions, then retry.');
  printStatus.textContent=messages.join(' ');
  openPrint.hidden=!jobs?.length;
 });
 openPrint.addEventListener('click',()=>{
  const tab=document.querySelector('.sms-workspace-nav [data-tab="print"]');
  if(!tab){printStatus.textContent='Print Centre is unavailable. Reopen Studio and check the job again.';return;}
  document.getElementById('closeInfo').click();
  tab.click();
  const retryJobs=currentJobs()?.filter(job=>job.status==='failed'||job.status==='cancelled');
  const card=retryJobs?.length===1
   ?Array.from(document.querySelectorAll('#smsJobs [data-print-job]')).find(el=>el.dataset.printJob===retryJobs[0].id)
   :null;
  (card?.querySelector('[data-job-prepare]:enabled')||tab).focus();
  printStatus.textContent='';
  openPrint.hidden=true;
 });
 panel.querySelector('[aria-controls="studioDiagnosticResults"]').addEventListener('click',()=>{
  if(reportUrl)URL.revokeObjectURL(reportUrl);
  const checks={
   studioInitialized:!!window.__sensoryStudio,
   previewCanvasPresent:!!document.querySelector('#viewport canvas'),
   browserReportsOnline:navigator.onLine,
   webAssemblyExposed:typeof WebAssembly==='object',
   workerApiExposed:typeof Worker==='function',
   localStorageReadable:storageReadable()
  };
  const lines=[
   checks.studioInitialized?'Studio initialized.':'Studio has not initialized. Check your connection and reopen the Studio URL.',
   checks.previewCanvasPresent?'Preview canvas found.':'No preview canvas found. Reopen Studio if you expected a preview.',
   checks.browserReportsOnline?'Browser reports an online connection. Studio asset availability was not checked.':'Browser reports it is offline. Reconnect before retrying network operations.',
   checks.webAssemblyExposed?'WebAssembly API is available.':'WebAssembly API unavailable. Try a current browser with WebAssembly enabled.',
   checks.workerApiExposed?'Worker API is available.':'Worker API unavailable. Try a current browser that supports background workers.',
   checks.localStorageReadable?'Local browser storage can be read. Saving and backup integrity were not tested.':'Local browser storage is blocked. Check this site’s storage permissions before relying on autosave.'
  ];
  results.replaceChildren(...lines.map(line=>{
   const item=document.createElement('li');
   item.textContent=line;
   return item;
  }));
  results.hidden=false;
  const version=document.querySelector('.version')?.textContent.trim();
  reportUrl=URL.createObjectURL(new Blob([JSON.stringify({version,checks},null,2)],{type:'application/json'}));
  download.href=reportUrl;
  download.hidden=false;
  status.textContent='Browser checks complete. You can review or download the report.';
 });
 panel.hidden=false;
}
