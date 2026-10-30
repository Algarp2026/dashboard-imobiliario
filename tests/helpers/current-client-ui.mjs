// Interact through the current workspace, without bypassing application handlers.
export async function closeOpportunity(page) {
  const drawer=page.locator('.d2-opportunity-drawer[open]');
  if(await drawer.count())await drawer.locator('[data-d2-close-opportunity]').click();
}
export async function clientTab(page,name) {
  const tab=page.getByRole('tab',{name,exact:true});
  if(await tab.getAttribute('aria-selected')==='true')return;
  await closeOpportunity(page);
  await tab.click();
}
export async function closeProfile(page) {
  const dialog=page.locator('#clientProfileDialog:not(.hidden)');
  if(await dialog.count()) {
    await closeOpportunity(page);
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
  const details=page.locator('#clientContactSettings');
  if(!await details.evaluate(e=>e.open))await details.locator('summary').click();
  await page.locator('[data-contact-settings]').waitFor();
}
export async function openOpportunity(page,number) {
  const open=page.locator('.d2-opportunity-drawer[open]');
  if(await open.count()&&await open.getAttribute('data-opportunity-unit')!==String(number))await open.locator('[data-d2-close-opportunity]').click();
  const card=await reveal(page,`[data-opportunity-unit="${number}"]`);
  if(await card.getAttribute('open')===null)await card.locator(':scope>summary').click();
  return card;
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
