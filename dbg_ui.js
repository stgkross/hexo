const puppeteer=require('puppeteer');
(async()=>{
  const browser=await puppeteer.launch({args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:1400,height:900});
  page.on('pageerror',e=>console.log('PAGEERROR:',e.message));
  await page.goto('file:///workspace/index.html',{waitUntil:'load'});
  await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>{try{localStorage.clear()}catch(e){}});
  await page.reload({waitUntil:'load'});
  await new Promise(r=>setTimeout(r,300));
  await page.click('#slots button[data-action="shop"]');
  await new Promise(r=>setTimeout(r,200));
  await page.click('#locGrid .loc-card[data-loc="1"]');
  await new Promise(r=>setTimeout(r,500));

  // select hero via internal state then updateUI
  const r1=await page.evaluate(()=>{
    S.selection={type:'unit',id:S.hero.id}; updateUI();
    return document.getElementById('actions').innerHTML;
  });
  console.log('HERO SELECTED ACTIONS:',r1);

  // summon an acolyte then select it
  const r2=await page.evaluate(async ()=>{
    // force mana and place acolyte next to hero
    S.mana=100;
    const h=S.hero;
    S.units.push({id:S.nextId++,type:'acolyte',q:h.q+1,r:h.r,hp:20,maxHp:20,atk:3,def:0,movesLeft:h.movesLeft,maxMoves:2,hasMoved:false,exhausted:false,onHold:false,autoPath:[],level:1,xp:0,evacuating:0,stunned:false,skills:{},passives:{},evoluitons:[]});
    const u=S.units[S.units.length-1];
    S.selection={type:'unit',id:u.id}; updateUI();
    return document.getElementById('actions').innerHTML;
  });
  console.log('ACOLYTE ACTIONS:',r2);

  // set autoPath on hero
  const r3=await page.evaluate(()=>{
    const h=S.hero; h.autoPath=[{q:h.q+1,r:h.r}]; h.evacuating=0;
    S.selection={type:'unit',id:h.id}; updateUI();
    return document.getElementById('actions').innerHTML;
  });
  console.log('HERO AUTOPATH ACTIONS:',r3);

  // evacuating in progress
  const r4=await page.evaluate(()=>{
    const h=S.hero; h.autoPath=[]; h.evacuating=3; h.evacTotal=5;
    S.selection={type:'unit',id:h.id}; updateUI();
    return {actions:document.getElementById('actions').innerHTML, sel:document.getElementById('selection').innerHTML.includes('Эвакуация')};
  });
  console.log('EVAC INPROG:',JSON.stringify(r4));
  await browser.close();
})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
