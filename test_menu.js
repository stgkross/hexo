const puppeteer=require('puppeteer');
(async()=>{
  const browser=await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:1400,height:900});
  const errors=[];
  page.on('pageerror',e=>errors.push('PAGEERROR: '+e.message));
  page.on('console',m=>{ if(m.type()==='error') errors.push('CONSOLE: '+m.text()); });
  await page.goto('file:///workspace/index.html',{waitUntil:'load'});
  await new Promise(r=>setTimeout(r,500));

  const slotBtns=await page.$$eval('#slots button',bs=>bs.map(b=>({text:b.textContent.trim(),action:b.dataset.action})));
  console.log('SLOT BUTTONS:',JSON.stringify(slotBtns));

  await page.click('#slots button[data-action="shop"]');
  await new Promise(r=>setTimeout(r,300));
  const locShown=await page.$eval('#locationScreen',el=>el.classList.contains('show'));
  console.log('LOCATION SCREEN SHOWN:',locShown);
  const shopCards=await page.$$eval('#shopGrid button',bs=>bs.length);
  const locCards=await page.$$eval('#locGrid .loc-card',cs=>cs.length);
  const backVisible=await page.$eval('#locBack',b=>getComputedStyle(b).display!=='none');
  console.log('shop buttons:',shopCards,'loc cards:',locCards,'back visible:',backVisible);

  await page.click('#locBack');
  await new Promise(r=>setTimeout(r,200));
  const backToMenu=await page.$eval('#locationScreen',el=>!el.classList.contains('show'));
  console.log('BACK TO MENU WORKS:',backToMenu);

  await page.click('#slots button[data-action="shop"]');
  await new Promise(r=>setTimeout(r,200));
  await page.click('#locGrid .loc-card[data-loc="1"]');
  await new Promise(r=>setTimeout(r,600));
  const appOpen=await page.$eval('#app',el=>el.classList.contains('open'));
  const startHidden=await page.$eval('#startScreen',el=>el.classList.contains('hide'));
  const canvasSize=await page.$eval('#cv',c=>({w:c.width,h:c.height}));
  console.log('APP OPEN:',appOpen,'START HIDDEN:',startHidden,'CANVAS:',JSON.stringify(canvasSize));

  const footer=await page.$eval('#footerBar',el=>el.textContent.trim());
  console.log('FOOTER:',footer);

  await page.screenshot({path:'/workspace/test_shot.png'});
  console.log('ERRORS:',errors.length?errors.join('\n'):'NONE');
  await browser.close();
})().catch(e=>{console.error('TEST FAIL',e);process.exit(1);});
