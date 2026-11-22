// WT-022 ranking prepared in PR #129. Navigation and availability live in the Studio.
export function normaliseToken(raw) {
 const s=String(raw??"").toLowerCase();
 const synonyms={
   leds:"pixel",led:"pixel",pixels:"pixel",cables:"wire",cable:"wire",wires:"wire",wiring:"wire",
   magnets:"magnet",holes:"hole",sockets:"socket",tabs:"tab",ears:"tab",ear:"tab",
   rings:"radial",ring:"radial",circle:"radial",circular:"radial",
   grids:"grid",profiles:"profile",fixings:"fixing",
   bevel:"chamfer",bevels:"chamfer",smoothing:"chamfer",rounded:"chamfer",rounding:"chamfer",smooth:"chamfer",smoothed:"chamfer",
   centre:"center",centres:"center",centers:"center",colours:"color",colour:"color",
   exporting:"export",printing:"print",prints:"print",saved:"save",
   millimetres:"mm",millimeters:"mm"
 };
 return synonyms[s]||s;
}
export function searchTokens(text) {
 const stop=new Set(["a","an","and","as","at","by","for","from","i","in","is","my","of","on","or","the","to","want","where","with","find","show","open","me"]);
 const input=String(text??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const raw=input.match(/[a-z0-9]+/g)||[];
 return [...new Set(raw.filter(w=>!stop.has(w)).map(normaliseToken))];
}
export function withinOneEdit(a,b) {
 if(a.length===b.length) {
  const first=[...a].findIndex((character,index)=>character!==b[index]);
  if(first>=0&&a[first]===b[first+1]&&a[first+1]===b[first]&&a.slice(first+2)===b.slice(first+2))return true;
 }
 if(Math.abs(a.length-b.length)>1)return false;
 let i=0,j=0,edits=0;
 while(i<a.length&&j<b.length){
   if(a[i]===b[j]){i++;j++;continue;}
   if(++edits>1)return false;
   if(a.length>b.length)i++;
   else if(a.length<b.length)j++;
   else {i++;j++;}
 }
 return edits+(a.length-i)+(b.length-j)<=1;
}
export function searchStudioTools(items,query,options={}) {
 if(!Array.isArray(items))throw new TypeError("Search catalogue must be an array.");
 const tokens=searchTokens(query);
 if(!tokens.length)return [];
 const maxResults=Number.isFinite(options.limit)?Math.max(1,Math.min(100,Math.floor(options.limit))):12;
 const fuzzy=options.fuzzy!==false;
 const qphrase=tokens.join(" ");
 const results=[];
 for(const item of items){
   if(!item||typeof item.id!=="string"||!item.id||typeof item.label!=="string")continue;
   const fields=[
     {values:[item.label],weight:12,kind:"label"},
     {values:Array.isArray(item.aliases)?item.aliases:[],weight:10,kind:"alias"},
     {values:Array.isArray(item.keywords)?item.keywords:typeof item.keywords==="string"?[item.keywords]:[],weight:6,kind:"keyword"},
     {values:[item.description,item.workspace].filter(Boolean),weight:3,kind:"context"}
   ];
   const chunks=fields.flatMap(f=>f.values.map(value=>({weight:f.weight,kind:f.kind,tokens:searchTokens(value),raw:String(value).toLowerCase().match(/[a-z0-9]+/g)||[]})));
   let score=0,complete=true;
   for(const token of tokens){
     let best=0;
     for(const chunk of chunks){
       if(chunk.tokens.includes(token))best=Math.max(best,chunk.weight);
       else if(token.length>=3&&chunk.tokens.some(t=>t.startsWith(token)))best=Math.max(best,Math.max(1,chunk.weight-3));
       else if(fuzzy&&token.length>=5&&[...chunk.tokens,...chunk.raw].some(t=>t.length>=5&&withinOneEdit(token,t)))best=Math.max(best,Math.max(1,chunk.weight-7));
     }
     if(!best){complete=false;break;}
     score+=best;
   }
   if(!complete)continue;
   const labelPhrase=searchTokens(item.label).join(" ");
   if(qphrase===labelPhrase)score+=50;
   else if(chunks.some(c=>c.kind==="alias"&&c.tokens.join(" ")===qphrase))score+=35;
   else if(labelPhrase.includes(qphrase))score+=12;
   const available=item.available!==false;
   results.push({item,score,available,matchedTokens:tokens});
 }
 return results.sort((a,b)=>b.score-a.score||a.item.label.localeCompare(b.item.label)||a.item.id.localeCompare(b.item.id)).slice(0,maxResults);
}
