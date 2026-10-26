const puppeteer=require('puppeteer');
(async()=>{
  const browser=await puppeteer.launch({args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:1400,height:900});
  const errors=[];
  page.on('pageerror',e=>errors.push('PAGEERROR: '+e.message));
  await page.goto('file:///workspace/index.html',{waitUntil:'load'});
  await new Promise(r=>setTimeout(r,300));
  await page.click('#slots button[data-action="shop"]');
  await page.click('#locGrid .loc-card[data-loc="1"]');
  await new Promise(r=>setTimeout(r,400));

  await page.evaluate(()=>{ S.hero.q=EVAC_POS.q; S.hero.r=EVAC_POS.r; window.startEvacuation(); });
  const st=await page.evaluate(()=>({evac:S.hero.evacuating,total:S.hero.evacTotal}));
  console.log('EVAC AT DOOR:',JSON.stringify(st));

  let turns=0;
  for (let i=0;i<5;i++) {
    const done=await page.evaluate(async ()=>{ if(S.gameOver)return true; await window.doEndTurn(); return S.gameOver; });
    turns++;
    await new Promise(r=>setTimeout(r,250));
    if (done) break;
  }
  const title=await page.$eval('#overTitle',el=>el.textContent);
  console.log('COMPLETED IN TURNS:',turns,'TITLE:',title);

  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:'load'});
  await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>{ localStorage.setItem('ht_slot_0', JSON.stringify({_version:6,meta:{gold:50},gameOver:true})); });
  await page.reload({waitUntil:'load'});
  await new Promise(r=>setTimeout(r,300));
  const slotBtns=await page.$$eval('#slots button',bs=>bs.map(b=>b.dataset.action));
  console.log('BUTTONS AFTER V6 SAVE:',JSON.stringify(slotBtns));
  await page.click('#slots button[data-slot="0"][data-action="shop"]');
  await new Promise(r=>setTimeout(r,200));
  const locShown=await page.$eval('#locationScreen',el=>el.classList.contains('show'));
  console.log('OPENED PREP SCREEN FROM STALE SLOT:',locShown);
  console.log('ERRORS:',errors.length?errors.join('\n'):'NONE');
  await browser.close();
})().catch(e=>{console.error('TEST FAIL',e.message);process.exit(1);});
