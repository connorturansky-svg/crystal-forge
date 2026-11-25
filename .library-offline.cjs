const {chromium}=require('playwright');
const {join}=require('node:path');
const launch=chromium.launch.bind(chromium);
chromium.launch=async (...args)=>{
 const browser=await launch(...args);
 async function mirror(context){
  await context.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/|http:\/\/127\.0\.0\.1:4321\//,async route=>{
   const url=new URL(route.request().url());
   const module=url.pathname.replace(/^\/npm\/([^/]+?)@[^/]+/,'$1');
   const file=url.hostname==='127.0.0.1'?join(__dirname,url.pathname==='/'?'index.html':url.pathname):join(__dirname,'node_modules',module);
   try{await route.fulfill({path:file,headers:{'access-control-allow-origin':'*'}});}
   catch{await route.abort();}
  });
 }
 const newPage=browser.newPage.bind(browser),newContext=browser.newContext.bind(browser);
 browser.newPage=async (...args)=>{const page=await newPage(...args);await mirror(page.context());return page;};
 browser.newContext=async (...args)=>{const context=await newContext(...args);await mirror(context);return context;};
 return browser;
};
