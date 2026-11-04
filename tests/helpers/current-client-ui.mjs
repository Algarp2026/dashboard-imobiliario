// Interact through the current workspace, without bypassing application handlers.
export async function closeOpportunity(page) {
  const dialog=page.locator('.client-opportunity-dialog[open]');if(!await dialog.count())return;
  await dialog.locator('[data-opportunity-close],[data-op-command="close-audit"]').click();
  const confirm=page.locator('[data-dialog-confirm]');
  if(await confirm.count()){
    const text=await confirm.locator('xpath=ancestor::*[contains(@class,"modal-backdrop")]').innerText();
    if(!text.includes('mantendo o rascunho')&&!text.includes('Fechar a edição administrativa?'))throw Error('Unexpected confirmation while closing opportunity');
    await confirm.click();
  }
  await dialog.waitFor({state:'hidden'});
}
export async function changeClientTab(page,name) {
  await closeOpportunity(page);await page.getByRole('tab',{name,exact:true}).click();
}
export async function openOpportunity(page, card) {
  const own=card.locator('dialog');
  if(await own.evaluate(node=>node.open))return;
  const current=page.locator('.client-opportunity-dialog[open]');
  if(await current.count())await closeOpportunity(page);
  const ancestors=card.locator('xpath=ancestor::details');
  for(let i=0;i<await ancestors.count();i++)if(!await ancestors.nth(i).evaluate(node=>node.open))await ancestors.nth(i).locator(':scope > summary').click();
  await card.locator('[data-opportunity-open]').click();await own.waitFor();
}
export async function closeProfile(page) {
  const opportunity=page.locator('.client-opportunity-dialog[open]');
  if(await opportunity.count())await closeOpportunity(page);
  const dialog=page.locator('#clientProfileDialog:not(.hidden)');
  if(await dialog.count()) {
    await page.locator('[data-profile-close]').click();
    await page.locator('#clientProfileDialog.hidden').waitFor({state:'attached'});
  }
}
export async function newClient(page) {
  await closeProfile(page);
  await page.locator('#openClientModal').click();
  await page.locator('#clientModal:not(.hidden)').waitFor();
}
export async function newEvent(page) {
  await closeProfile(page);
  await page.locator('#openEventModalBtn').click();
  await page.locator('#eventModal:not(.hidden)').waitFor();
}
export async function contactSettings(page) {
  await reveal(page,'#clientContactSettings');
  const details=page.locator('#clientContactSettings');
  if(!await details.evaluate(e=>e.open))await details.locator('summary').click();
  await page.locator('[data-contact-settings]').waitFor();
}
export async function reveal(page, selector) {
  const target=page.locator(selector),ancestors=target.locator('xpath=ancestor::details');
  for(let i=0;i<await ancestors.count();i++){
    const details=ancestors.nth(i);
    if(!await details.evaluate(e=>e.open))await details.locator(':scope > summary').click();
  }
  return target;
}
export async function syncAction(page, selector='[data-sync-retry]') {
  const url=new URL(page.url()),client=url.searchParams.get('client'),tab=url.searchParams.get('clientTab');
  await closeProfile(page);
  if(await page.locator('#commercialSyncBadge').getAttribute('aria-expanded')!=='true')await page.locator('#commercialSyncBadge').click();
  await page.locator(selector).click();
  if(selector==='[data-sync-retry]'){
    await page.waitForFunction(()=>!document.querySelector('[data-sync-retry]')?.disabled);
    if(client){await page.locator(`[data-client="${client}"]`).click();if(tab)await page.locator(`[data-ux-client-tab="${tab}"]`).click()}
  }
}
