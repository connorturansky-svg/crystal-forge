import {createModelDrawer} from './drawer.mjs';
import {createProject,createModel,addModel,openTab,closeTab,reorderTabs,editModel} from '../../../studio-documents.js';
const project=createProject({id:'drawer-demo',title:'Demo project'});
const names=['Mini_Red','Big_Blue','Big_Red','Yellow','Big_Yellow','long_red','Mini_Yellow','Mini_Yellow_2','long_yellow'];
for(let i=0;i<(new URLSearchParams(location.search).has('large')?120:names.length);i++)addModel(project,createModel({id:'m'+i,name:names[i]||'Model '+i,typeId:'crystals'}));
openTab(project,'m4');
const refresh=()=>{document.querySelector('#active').textContent='Active: '+project.models.find(m=>m.id===project.activeTab)?.name;drawer.update();};
const drawer=createModelDrawer(document.querySelector('#viewer'),{
 getProject:()=>project,select:id=>{openTab(project,id);refresh();},close:id=>{closeTab(project,id);refresh();},
 add:()=>{const name=prompt('New model name');if(name?.trim()){addModel(project,createModel({name:name.trim(),typeId:'crystals'}));refresh();}},
 rename:id=>{const name=prompt('Model name',project.models.find(m=>m.id===id).name);if(name?.trim()){editModel(project,id,{name:name.trim()});refresh();}},
 reorder:ids=>{reorderTabs(project,ids);refresh();},previewKey:(p,r)=>p.id+':'+r.id+':'+r.revision,
 renderPreview:async()=>({reason:'Fixture has no saved geometry'})
});
refresh();window.drawerDemo={project,drawer};
