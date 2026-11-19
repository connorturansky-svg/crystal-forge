import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../studio-startup-recovery.js',import.meta.url),'utf8');

function makeBrowser(search=''){
 const handlers={},elements=[];
 class Node {
  constructor(tag='div'){this.tagName=tag;this.children=[];this.style={};this.textContent='';this.parent=null;}
  setAttribute(key,value){this[key]=value;}
  append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node);}}
  remove(){this.parent?.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}
 }
 const body=new Node('body'),status=new Node('span');
 status.textContent='Loading 3D editor…';
 const document={body,createElement:tag=>new Node(tag),
  getElementById:id=>id==='status'?status:null,
  querySelector:()=>null};
 const location={search,origin:'https://example.invalid',pathname:'/forge/',href:'https://example.invalid/forge/'+search,
  assign(){throw Error('Do not navigate during startup diagnostics test');},reload(){}};
 let interval;
 const sandbox={window:null,document,location,navigator:{onLine:true,userAgent:'Test'},
  performance:{now:()=>0},URL,URLSearchParams,Date,
  addEventListener:(name,fn)=>handlers[name]=fn,
  setInterval:fn=>{interval=fn;return 1;},clearInterval:()=>{},
  Blob,console};
 sandbox.window=sandbox;
 runInNewContext(source,sandbox);
 return {sandbox,body,status,handlers,tick:()=>interval()};
}
// Modules may fail before the application attaches handlers. The independent
// classic-script recovery must still display the real error and safe-mode path.
const broken=makeBrowser();
assert.equal(broken.sandbox.__wtStartupDiagnostics.check(),'stalled');
assert.equal(broken.body.children.length,1,'Failure state shows visible recovery UI');
assert.match(broken.body.children[0].textContent||broken.body.children[0].children[0].textContent,/3D editor did not finish/);
broken.handlers.error({message:'Failed to load module script'});
assert.match(broken.sandbox.__wtStartupDiagnostics.report(),/Failed to load module script/);
assert.match(broken.sandbox.__wtStartupDiagnostics.report(),/Studio initialised: false/);
broken.sandbox.__sensoryStudio={project:{}};
assert.equal(broken.sandbox.__wtStartupDiagnostics.check(),'ready');
assert.equal(broken.body.children.length,0,'Recovery UI disappears on successful app start');
assert.equal(makeBrowser('?layout=legacy').sandbox.__wtStartupDiagnostics.check(),'stalled',
 'layout=legacy is NOT the standalone Crystal safe mode');
const safe=makeBrowser('?legacy=1');
safe.status.textContent='Ready — Crystal Clusters';
assert.equal(safe.sandbox.__wtStartupDiagnostics.check(),'stalled',
 'Legacy canvas also needs to exist before the app is declared ready');
console.log('Studio startup independent module failure, recovery UI, error logging and safe URL regression passed.');
