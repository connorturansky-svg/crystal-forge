const builders=[
 ['crystals','Crystal Clusters','Shape a faceted cluster, edit individual crystals and fit an illuminated base.'],
 ['tactile-tiles','Tactile Texture Tiles','Choose a relief pattern and outline, then add fittings and real edge tabs.'],
 ['gears','Cogs & Gears','Design solid or openwork wheels. Cable channels require a compatible solid surface.'],
 ['waves','Waves & Organic Forms','Sculpt flowing surfaces. Gentle parallel Waves can carry a groove along their surface.'],
 ['control-caps','Buttons & Control Caps','Design a control shell or a stationary display. Fixed tabs require stationary stock.'],
 ['characters','Characters & Silhouettes','Shape a flat or layered character. An optional backing adds room for fittings and tabs.'],
 ['light-pods','Glowing Pebbles & Light Pods','Choose a solid pebble or an accessible shell. Check the wall and opening before fitting hardware.']
];

export const featureCategories={
 models:'Model builders',design:'Design & shaping',build:'Build & 3D editing',pixels:'Pixels & fit',
 wires:'Wiring & lighting',mounts:'Mounting & assembly',library:'Library & projects',
 print:'Print Centre & Cura',inspection:'Inspection',help:'Accessibility & help'
};

export const studioFeatures=[
 ...builders.map(([id,title,description])=>({id,title,description,category:'models',family:id,status:'available',action:'family',label:'Open '+title})),
 {id:'edge-finishing',title:'Geometric edge finishing',description:'Round or chamfer real outside edges in all seven builders. Choose top, side, bottom or all edge groups, then verify walls and fit.',category:'build',status:'available',action:'build',label:'Open Build'},
 {id:'shape',title:'Design workspaces',description:'Edit dimensions and shape controls. Use the precision fields for measured values.',category:'design',status:'available',action:'design',label:'Go to Design'},
 {id:'editing',title:'Place and move hardware',description:'Select a visible fitting, then hold and drag it along a supported face. An invalid move keeps the previous position.',category:'build',status:'partial',action:'build',label:'Go to Build'},
 {id:'fit',title:'Measured pixel profiles',description:'Save the body, flange, cap and wire dimensions. Compare the actual cutter and download a fit coupon.',category:'pixels',status:'available',action:'pixels',label:'Open Pixel Fittings'},
 {id:'routing',title:'Serial cable routes',description:'Follow the IN → P1 → OUT guide. Enable physical channels separately where the selected face and stock allow them.',category:'wires',status:'partial',action:'wires',label:'Open wiring'},
 {id:'tabs',title:'Mounting holes and external tabs',description:'Cut manual through-holes or add attached tabs to a compatible backing. Printed strength needs physical validation.',category:'mounts',status:'partial',action:'mounts',label:'Open mounting'},
 {id:'projects',title:'Projects and backups',description:'Save model revisions, reopen a project or download an editable workspace backup.',category:'library',status:'available',action:'library',label:'Open Library'},
 {id:'fabricate',title:'STL, 3MF and Cura downloads',description:'Prepare the actual mesh, select a printer profile and download the matching files.',category:'print',status:'available',action:'print',label:'Open Print Centre'},
 {id:'sections',title:'Prepared mesh cutaways',description:'Inspect the solid after cutting. Look through sockets, wire channels and mounting features before exporting.',category:'inspection',status:'available',action:'inspect',label:'Find mesh inspection'},
 {id:'keys',title:'Keyboard and display help',description:'Find keyboard controls, view shortcuts and the options for light and dark themes.',category:'help',status:'available',action:'help',label:'Open Help'},
 {id:'physical',title:'Printed fit certification',description:'Verify fit, load and supports on an actual print. The app reports software checks and geometry measurements.',category:'inspection',status:'unavailable'}
];

const sketches={
 crystals:'M12 49 20 25 30 16 39 33 36 50M31 50 39 18 53 7 63 23 59 50M55 50 64 28 77 19 84 32 79 50M13 50H83',
 'tactile-tiles':'M14 30 49 12 82 29 82 41 47 55 14 41ZM14 30 47 44 82 29M26 29 49 18 72 29M34 34 48 26 62 33',
 gears:'M48 13 54 11 57 18 64 20 71 17 76 23 72 30 74 37 81 41 79 49 70 49 64 54 58 54 53 49 45 52 39 55 31 50 32 43 26 37 19 39 16 31 24 28 27 22 26 15 34 12 40 17 48 13ZM58 32a10 10 0 1 1-20 0 10 10 0 1 1 20 0Z',
 waves:'M9 39C26 39 27 16 44 16S63 39 85 37M9 47C26 47 29 24 45 24S63 47 85 45M9 54H85M14 32C27 29 27 11 44 11S64 29 82 29',
 'control-caps':'M24 28C24 20 35 15 48 15S72 20 72 28V45C72 53 61 56 48 56S24 53 24 45ZM24 28C24 37 72 37 72 28M41 29 48 21 55 29M35 38V48M48 40V51M61 38V48',
 characters:'M18 42C13 31 23 25 32 27 30 16 43 12 51 20 58 11 70 16 70 26 80 26 83 34 78 42 73 51 24 53 18 42ZM35 34h1m22 0h1m-20 7c5 4 13 4 17 0',
 'light-pods':'M15 46C18 28 30 15 49 15 69 15 80 31 82 46 75 55 21 56 15 46ZM26 46C34 42 62 42 70 46M38 33C44 28 52 29 58 33M45 5v5m24-2-4 6m-38-6 4 6',
 design:'M19 48 71 15 79 25 27 58ZM34 45l-4-7m15 1-4-7m15 0-4-7m15 0-4-7',
 build:'M41 50V14m0 0-6 6m6-6 6 6M41 50h35m0 0-6-6m6 6-6 6M41 50 22 32m0 0v8m0-8h8',
 pixels:'M30 34V25a18 18 0 1 1 36 0v9m-43 0h50v7H23Zm14 7v14m22-14v14',
 wires:'M14 44H33V19H64V44H83M18 44a4 4 0 1 1-8 0 4 4 0 1 1 8 0Zm69 0a4 4 0 1 1-8 0 4 4 0 1 1 8 0Z',
 mounts:'M16 30h19V18h26v12h19v18H61v7H35v-7H16Zm15 9a5 5 0 1 1-10 0 5 5 0 1 1 10 0Zm44 0a5 5 0 1 1-10 0 5 5 0 1 1 10 0Z',
 library:'M21 13h18l7 8h30v29H21ZM28 31h39m-39 8h27',
 print:'M25 35V12h46v23M17 33h62v16H17ZM27 54h42M44 21h9m-4-4v9',
 inspection:'M13 33C24 17 38 15 48 15s24 2 35 18C72 49 58 51 48 51S24 49 13 33Zm46 0a11 11 0 1 1-22 0 11 11 0 1 1 22 0Z',
 help:'M16 19h64v29H16Zm9 9h4m7 0h4m7 0h4m7 0h4m7 0h4M26 38h8m6 0h22m6 0h5'
};
const statusLabels={available:'Available',partial:'Limited by geometry',unavailable:'Unavailable in app'};

function visual(art,key){
 const ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 96 64');
 svg.setAttribute('aria-hidden','true');
 const path=document.createElementNS(ns,'path');
 path.setAttribute('d',sketches[key]);
 svg.append(path);
 art.append(svg);
}

export function installFeatureCatalogue(root,{canNavigate,navigate}){
 const search=root.querySelector('input'),filter=root.querySelector('select');
 const grid=root.querySelector('[data-feature-grid]'),count=root.querySelector('[data-feature-count]');
 const option=(label,id)=>new Option(label,id);
 for(const [id,label] of Object.entries(featureCategories))filter.add(option(label,id));
 const familyGroup=document.createElement('optgroup');
 familyGroup.label='Model families';
 for(const [id,label] of builders)familyGroup.append(option(label,id));
 filter.append(familyGroup);
 const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  for(const {target,isIntersecting} of entries)if(isIntersecting){
   visual(target,target.dataset.art);
   observer.unobserve(target);
  }
 },{root,rootMargin:'120px'}):null;
 function render(){
  observer?.disconnect();
  grid.replaceChildren();
  const words=search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let matches=0;
  for(const feature of studioFeatures){
   const category=featureCategories[feature.category],status=statusLabels[feature.status];
   if(filter.value&&filter.value!==feature.category&&filter.value!==feature.family)continue;
   const text=[feature.title,feature.description,category,status].join(' ').toLowerCase();
   if(!words.every(word=>text.includes(word)))continue;
   matches++;
   const card=document.createElement('article');
   card.className='feature-card';
   card.dataset.featureId=feature.id;
   const art=document.createElement('div');
   art.className='feature-art';
   art.dataset.art=feature.family||feature.category;
   if(observer)observer.observe(art);else visual(art,art.dataset.art);
   const heading=document.createElement('h3');
   heading.textContent=feature.title;
   const description=document.createElement('p');
   description.textContent=feature.description;
   const badge=document.createElement('span');
   badge.className='feature-status';
   badge.dataset.status=feature.status;
   badge.textContent=status;
   card.append(art,badge,heading,description);
   if(feature.action){
    const action=document.createElement('button');
    action.type='button';
    action.textContent=feature.label;
    action.disabled=!canNavigate(feature);
    if(action.disabled){
     const hint=document.createElement('p');
     hint.className='feature-hint';
     hint.textContent='Open a model in Studio to use this shortcut.';
     card.append(hint);
    }
    action.onclick=()=>navigate(feature);
    card.append(action);
   }
   grid.append(card);
  }
  count.textContent=matches?matches+' '+(matches===1?'feature':'features'):'No features match. Try another search or category.';
 }
 search.addEventListener('input',render);
 filter.addEventListener('change',render);
 return render;
}
