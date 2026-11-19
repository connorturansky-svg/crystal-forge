/* WT-021 P0: small classic-script watchdog. Must run BEFORE the ES-module
 * import map so failures to fetch Three.js / any local module are observable.
 * Never reads, clears or mutates any user's saved workspace / credentials.
 */
(function(){
 'use strict';
 const started=performance.now(),events=[],isLegacy=new URLSearchParams(location.search).has('legacy');
 let warning=null,completed=false;
 function capture(message){
  const text=String(message||'Unknown startup error').slice(0,480);
  if(text&&!events.includes(text))events.push(text);
  if(events.length>12)events.shift();
 }
 addEventListener('error',event=>{
  const src=event.target?.src||event.target?.href;
  capture(event.message||event.error?.message||(src?'Asset/module failed to load: '+src:'Unexpected browser error'));
 },true);
 addEventListener('unhandledrejection',event=>capture(event.reason?.stack||event.reason?.message||event.reason));
 function ready(){
  if(isLegacy){
   return !/Loading 3D editor/i.test(document.getElementById('status')?.textContent||'')&&
    !!document.querySelector('#viewport canvas');
  }
  return !!window.__sensoryStudio;
 }
 function diagnostic(){
  return [
   'Wonder Trunks Studio startup diagnostics',
   'Time: '+new Date().toISOString(),
   'Page: '+location.origin+location.pathname,
   'Legacy Crystal mode: '+isLegacy,
   'Studio initialised: '+!!window.__sensoryStudio,
   'Status: '+(document.getElementById('status')?.textContent||'(unavailable)'),
   'Elapsed: '+Math.round(performance.now()-started)+' ms',
   'Navigator online: '+navigator.onLine,
   'Browser: '+navigator.userAgent,
   'Observed errors:',
   ...(events.length?events.map(e=>'- '+e):['- None captured; this can also indicate an unresponsive main thread.'])
  ].join('\n');
 }
 function show(){
  if(warning||!document.body)return;
  warning=document.createElement('aside');
  warning.id='wtStartupRecovery';warning.setAttribute('role','alert');
  warning.setAttribute('aria-label','3D editor startup problem');
  Object.assign(warning.style,{
   position:'fixed',bottom:'16px',left:'16px',zIndex:'2147483000',
   maxWidth:'min(460px,calc(100vw - 32px))',padding:'15px',
   color:'#f1f6ff',background:'#192842',border:'2px solid #ffbd6a',
   borderRadius:'10px',boxShadow:'0 9px 30px #0009',
   font:'14px/1.45 system-ui,sans-serif'
  });
  const title=document.createElement('strong');title.textContent='3D editor did not finish starting';
  const explanation=document.createElement('p');
  explanation.textContent='An app module may have failed or the editor may be stuck. Your saved projects have NOT been deleted. Use diagnostics to identify the cause. Do not clear your browser storage.';
  const message=document.createElement('p');message.id='wtStartupError';
  message.style.overflowWrap='anywhere';
  message.textContent=events.at(-1)||'No JavaScript error was captured.';
  const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
  const button=(label,action)=>{
   const b=document.createElement('button');b.type='button';b.textContent=label;
   b.style.cssText='padding:7px 9px;border:1px solid #8fa9d0;border-radius:6px;background:#243b60;color:white;cursor:pointer';
   b.onclick=action;actions.append(b);return b;
  };
  button('Download diagnostics',()=>{
   const blob=new Blob([diagnostic()],{type:'text/plain'});
   const href=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=href;link.download='wonder-trunks-startup-diagnostics.txt';
   document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);
  });
  button('Try legacy Crystal editor',()=>{
   const next=new URL(location.href);
   next.searchParams.set('legacy','1');next.searchParams.delete('layout');
   location.assign(next.toString());
  });
  button('Retry loading',()=>location.reload());
  warning.append(title,explanation,message,actions);
  document.body.append(warning);
 }
 function check(force=false){
  if(ready()){completed=true;warning?.remove();warning=null;return 'ready';}
  if(!force&&performance.now()-started<14000)return 'waiting';
  show();return 'stalled';
 }
 // A fail-fast public diagnostic path is useful to CI, without waiting 14 seconds.
 window.__wtStartupDiagnostics={check:()=>check(true),report:diagnostic,errors:()=>[...events]};
 const timer=setInterval(()=>{
  if(completed){clearInterval(timer);return;}
  check();
 },1000);
})();
