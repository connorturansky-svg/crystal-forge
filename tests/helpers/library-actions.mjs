export async function revealLibraryActions(card){
 const toggle=card.locator('.sms-library-actions-toggle');
 await toggle.waitFor();
 if(await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
}

export async function confirmLibraryDestination(page){
 const dialog=page.getByRole('dialog',{name:'Choose model destination'});
 await dialog.getByRole('button',{name:'Add model',exact:true}).click();
 await dialog.waitFor({state:'hidden'});
}
