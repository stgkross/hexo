const puppeteer=require('puppeteer');
(async()=>{
  const browser=await puppeteer.launch({args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:1400,height:900});
  const errors=[];
  page.on('pageerror',e=>errors.push('PAGEERROR: '+e.message));
  page.on('console',m=>{ if(m.type()==='error') errors.push('CONSOLE: '+m.text()); });
  await page.goto('file:///workspace/index.html',{waitUntil:'load'});
  await new Promise(r=>setTimeout(r,400));

  await page.click('#slots button[data-action="shop"]');
  await new Promise(r=>setTimeout(r,200));
  await page.click('#locGrid .loc-card[data-loc="1"]');
  await new Promise(r=>setTimeout(r,500));

  const evacBtnText=await page.evaluate(()=>{
    const b=document.querySelector('#actions button.evac');
    return b?b.textContent:null;
  });
  console.log('EVAC BUTTON:',evacBtnText);

  await page.evaluate(()=>window.startEvacuation());
  await new Promise(r=>setTimeout(r,200));
  const evacState=await page.evaluate(()=>({evac:S.hero.evacuating,total:S.hero.evacTotal}));
  console.log('EVAC STATE:',JSON.stringify(evacState));

  for (let i=0;i<6;i++) {
    const done=await page.evaluate(async ()=>{
      if (S.gameOver) return true;
      await window.doEndTurn();
      return S.gameOver;
    });
    await new Promise(r=>setTimeout(r,300));
    if (done) break;
  }
  const overShown=await page.$eval('#over',el=>el.classList.contains('show')||el.className.includes('show'));
  const overTitle=await page.$eval('#overTitle',el=>el.textContent);
  console.log('OVER SHOWN:',overShown,'TITLE:',overTitle);

  await page.click('#restart');
  await new Promise(r=>setTimeout(r,300));
  const menuBack=await page.$eval('#startScreen',el=>!el.classList.contains('hide'));
  const slotInfo=await page.$$eval('#slots .slot-info',els=>els.map(e=>e.textContent));
  console.log('MENU AFTER RESTART:',menuBack,'SLOTS:',JSON.stringify(slotInfo));

  await page.click('#slots button[data-action="shop"]');
  await new Promise(r=>setTimeout(r,200));
  const goldAfter=await page.$eval('#metaGold',el=>el.textContent);
  console.log('META GOLD SCREEN:',goldAfter);

  await page.click('#locGrid .loc-card[data-loc="1"]');
  await new Promise(r=>setTimeout(r,400));
  const appOpen2=await page.$eval('#app',el=>el.classList.contains('open'));
  console.log('SECOND RUN STARTS:',appOpen2);

  await page.evaluate(()=>document.getElementById('saveExit').click());
  await new Promise(r=>setTimeout(r,300));
  const contBtn=await page.$$eval('#slots button',bs=>bs.map(b=>b.dataset.action));
  console.log('AFTER SAVE-EXIT ACTIONS:',JSON.stringify(contBtn));
  const hasContinue=contBtn.includes('continue');
  if (hasContinue) {
    await page.click('#slots button[data-action="continue"]');
    await new Promise(r=>setTimeout(r,400));
    const resumed=await page.$eval('#app',el=>el.classList.contains('open'));
    console.log('RESUME ACTIVE RUN WORKS:',resumed);
  }

  const canvasFits=await page.evaluate(()=>{
    const c=document.getElementById('cv');
    return {w:c.clientWidth,h:c.clientHeight,win:[window.innerWidth,window.innerHeight]};
  });
  console.log('CANVAS FIT:',JSON.stringify(canvasFits));

  console.log('ERRORS:',errors.length?errors.join('\n'):'NONE');
  await browser.close();
})().catch(e=>{console.error('TEST FAIL',e.message);process.exit(1);});
