const puppeteer=require('puppeteer');
(async()=>{
  const browser=await puppeteer.launch({args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:1400,height:900});
  page.on('pageerror',e=>console.log('PAGEERROR:',e.message));
  page.on('console',m=>{ if(m.type()==='error') console.log('CONSOLE ERR:',m.text()); });
  await page.goto('file:///workspace/index.html',{waitUntil:'load'});
  await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>{ try{localStorage.clear()}catch(e){} });
  await page.reload({waitUntil:'load'});
  await new Promise(r=>setTimeout(r,300));

  await page.click('#slots button[data-action="shop"]');
  await new Promise(r=>setTimeout(r,200));
  await page.click('#locGrid .loc-card[data-loc="1"]');
  await new Promise(r=>setTimeout(r,500));

  // check UI buttons visible
  const ui=await page.evaluate(()=>({
    summon: !!document.querySelector('#actions button.summon'),
    evac: !!document.querySelector('#actions button.evac'),
    hold: !!document.querySelector('#actions button.hold'),
    actionsHTML: document.getElementById('actions').innerHTML.slice(0,200),
    notify: getComputedStyle(document.getElementById('notifyBtn')).display,
    endTurnDisabled: document.getElementById('endTurn').disabled,
  }));
  console.log('UI:',JSON.stringify(ui,null,1));

  await page.evaluate(()=>window.startEvacuation());
  for (let i=0;i<12;i++){
    const st=await page.evaluate(async ()=>{
      if(S.gameOver) return {over:true,turn:S.turn};
      await window.doEndTurn();
      return {over:false,turn:S.turn,hq:S.hero.q,hr:S.hero.r,evac:S.hero.evacuating,atDoor:!!S.hero.evacAtDoor,moves:S.hero.movesLeft,animating:window.isAnimating};
    });
    console.log('T'+i, JSON.stringify(st));
    if(st.over) break;
    await new Promise(r=>setTimeout(r,100));
  }
  const overCls=await page.$eval('#over',el=>el.className);
  console.log('OVER CLASS:',overCls);
  await browser.close();
})();
