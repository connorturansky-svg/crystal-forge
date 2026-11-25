import {destinationChoices} from './library-destination.mjs';

function element(tag,text,attrs={}){
 const el=document.createElement(tag);
 if(text)el.textContent=text;
 for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);
 return el;
}
function labelled(text,field){
 const label=element('label',text+' ');
 label.append(field);return label;
}
// All controls work without hover; the modal only calls commit on explicit submit.
export function openLibraryDestination(workspace,{source,suggestion,linked=false,revisions=[],commit}){
 const whole=source.kind==='project-template';
 const title=whole?'Create project from template':source.kind==='built-in'?'Name new model':'Choose model destination';
 const opener=document.activeElement;
 const dialog=element('dialog','',{'aria-label':title,'data-library-destination':''});
 const form=element('form');
 const heading=element('h2',title);
 const description=element('p',whole?'Create an independent project using this template’s saved models and project settings. The existing project will be saved first.':
  (linked?'The new model will be linked to the exact selected source revision.':'The new model will be an independent editable copy.'));
 form.append(heading,description);
 const choices=whole?[{kind:'new',label:'New project from template'}]:destinationChoices(workspace);
 const destination=element('select','',{'data-library-destination-choice':''});
 for(const [i,choice] of choices.entries())destination.add(new Option(choice.label,String(i)));
 if(!whole)form.append(labelled('Destination project',destination));
 let selectedRevision=source.revision;
 const name=element('input','',{required:'',maxlength:'100','data-library-model-name':''});name.value=suggestion||'';
 if(!whole){
  if(revisions.length){
   const revision=element('select','',{'data-library-revision':''});
   for(const item of revisions)revision.add(new Option('Revision '+item.revision+' — '+item.model.name,String(item.revision)));
   revision.value=String(selectedRevision);
   revision.onchange=()=>{
    const previous=revisions.find(v=>v.revision===selectedRevision);
    selectedRevision=Number(revision.value);
    if(name.value===previous?.model.name)name.value=revisions.find(v=>v.revision===selectedRevision).model.name;
   };
   form.append(labelled('Source revision',revision));
  }
  form.append(labelled('Model name',name));
 }
 const projectName=element('input','',{maxlength:'100','data-library-project-name':''});
 projectName.value=whole?suggestion:'';
 const newLabel=labelled('New project name',projectName);
 const notice=element('p','',{'data-destination-notice':''});
 form.append(newLabel,notice);
 const update=()=>{
  const choice=choices[Number(destination.value)];
  const fresh=choice.kind==='new';newLabel.hidden=!fresh;projectName.required=fresh;
  notice.textContent=whole?'The template’s project defaults are copied into the independent project.':
   fresh?'Starts with Studio defaults: Ultimaker 3 Extended, 0.4 mm nozzle, PLA, balanced quality. No custom project calibration is inherited.':
   choice.kind==='snapshot'?'The exact saved version opens with your added model. The outgoing project and original saved version are preserved.':
   'Adds to the current project without changing its other models or prepared print jobs.';
 };
 destination.onchange=update;update();
 const error=element('p','',{role:'alert'});
 const actions=element('div','',{class:'sms-actions'});
 const submit=element('button',whole?'Create project':source.kind==='built-in'?'Create model':'Add model',{type:'submit'});
 const cancel=element('button','Cancel',{type:'button'});cancel.onclick=()=>dialog.close();
 actions.append(submit,cancel);form.append(error,actions);dialog.append(form);
 form.onsubmit=event=>{
  event.preventDefault();error.textContent='';
  try{
   const request={source:{...source,...(source.kind==='library'?{revision:selectedRevision}:{})},
    destination:choices[Number(destination.value)],modelName:name.value,projectName:projectName.value,linked};
   commit(request);dialog.close();
  }catch(problem){error.textContent=problem.message||'Could not save the destination.';}
 };
 dialog.addEventListener('close',()=>{dialog.remove();if(opener?.isConnected&&document.activeElement===document.body)opener.focus({preventScroll:true});},{once:true});
 document.body.append(dialog);dialog.showModal();(whole?projectName:name).select();(whole?projectName:name).focus();
 return dialog;
}
