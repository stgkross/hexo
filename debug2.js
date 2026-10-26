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
  await new Promise(r=>setTimeout(r,600));

  // 1) summon acolyte via UI buttons
  await page.click('#actions button.summon');
  await new Promise(r=>setTimeout(r,150));
  // click a free hex near hero to summon
  const sumOK=await page.evaluate(()=>{
    for (const [dq,dr] of DIRS) {
      const q=S.hero.q+dq,r=S.hero.r+dr;
      if (inMap(q,r)&&!entityAt(q,r)&&canSummonAt(q,r)) { handleCanvasClick({clientX:0,clientY:0}); return true; }
    }
    return false;
  });
  console.log('SUMMON attempt:',sumOK);
  await page.evaluate(()=>{ // direct summon fallback
    for (const [dq,dr] of DIRS) {
      const q=S.hero.q+dq,r=S.hero.r+dr;
      if (inMap(q,r)&&!entityAt(q,r)&&S.mana>=getSummonCost()) { S.summonMode=false; summon(q,r); return; }
    }
  });
  await new Promise(r=>setTimeout(r,200));
  console.log('UNITS:',await page.evaluate(()=>JSON.stringify(S.units.map(u=>u.isHero?'H':u.type))));

  // 2) set route on hero via UI click far away
  const routeSet=await page.evaluate(()=>{
    S.selection={type:'unit',id:S.hero.id}; updateUI();
    const far=MAP.filter(h=>hexDist(h.q,h.r,S.hero.q,S.hero.r)>=3&&!entityAt(h.q,h.r))[0];
    return setAutoPath(S.hero,far);
  });
  console.log('ROUTE SET:',routeSet,'len:',await page.evaluate(()=>S.hero.autoPath.length));

  // 3) end turn -> auto move should consume route
  await page.evaluate(()=>doEndTurn());
  await new Promise(r=>setTimeout(r,2500));
  console.log('AFTER TURN: path len',await page.evaluate(()=>S.hero.autoPath.length),'turn',await page.evaluate(()=>S.turn));

  // 4) select hero again and check hold button presence in DOM
  await page.evaluate(()=>{ S.selection={type:'unit',id:S.hero.id}; updateUI(); });
  const holdBtn=await page.$('#actions button.hold');
  console.log('HOLD BTN VISIBLE:',!!holdBtn, holdBtn?await page.evaluate(e=>e.textContent,holdBtn):null);

  // 5) notify/combat buttons visibility
  console.log('NOTIFY:',await page.$eval('#notifyBtn',e=>e.style.display+' | '+e.textContent));
  console.log('COMBAT:',await page.$eval('#combatBtn',e=>e.style.display+' | '+e.textContent));

  // 6) evac flow at door: teleport hero to EVAC_POS, start evac, count turns
  await page.evaluate(()=>{ S.hero.q=EVAC_POS.q; S.hero.r=EVAC_POS.r; S.hero.autoPath=[]; startEvacuation(); });
  let turns=0;
  for (let i=0;i<6;i++) {
    const done=await page.evaluate(async ()=>{ if(S.gameOver)return true; await doEndTurn(); return S.gameOver; });
    turns++;
    await new Promise(r=>setTimeout(r,200));
    const st=await page.evaluate(()=>({ev:S.hero.evacuating,atDoor:S.hero.evacAtDoor,over:S.gameOver}));
    console.log('EVAC turn',turns,JSON.stringify(st));
    if (done) break;
  }
  console.log('TITLE:',await page.$eval('#overTitle',e=>e.textContent));
  console.log('ERRORS:',errors.length?errors.join('\n'):'NONE');
  await browser.close();
})().catch(e=>{console.error('DEBUG FAIL',e);process.exit(1);});
