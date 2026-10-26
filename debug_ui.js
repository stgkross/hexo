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

  const dump = async (tag)=>{
    const st=await page.evaluate(()=>({
      turn:S?S.turn:null, round:S?S.round:null,
      units:S?S.units.map(u=>({id:u.id,type:u.isHero?'HERO':u.type,hp:u.hp,moved:u.hasMoved,exh:u.exhausted,onHold:u.onHold,evac:u.evacuating,path:(u.autoPath||[]).length})):null,
      enemies:S?S.enemies.length:null,
      notifyVisible:(()=>{const n=document.getElementById('notifyBtn');return n&&getComputedStyle(n).display})(),
      combatVisible:(()=>{const c=document.getElementById('combatBtn');return c&&getComputedStyle(c).display})(),
      actionsHTML:document.getElementById('actions').innerHTML.slice(0,300),
      pending:typeof pendingUnitsList==='function'?pendingUnitsList().map(u=>u.id):null,
      combatIds:typeof combatUnitsSet==='function'?[...combatUnitsSet()]:null,
      endTurnDisabled:document.getElementById('endTurn').disabled,
    }));
    console.log(tag, JSON.stringify(st,null,1));
  };

  await dump('AT START');

  // click on hero hex to select hero
  await page.evaluate(()=>{ S.selection={type:'unit',id:S.hero.id}; updateUI(); draw(); });
  await new Promise(r=>setTimeout(r,200));
  await dump('HERO SELECTED');

  // end turn once
  await page.evaluate(()=>window.doEndTurn?window.doEndTurn():doEndTurn());
  await new Promise(r=>setTimeout(r,1500));
  await dump('AFTER TURN 2');

  console.log('ERRORS:',errors.length?errors.join('\n'):'NONE');
  await browser.close();
})().catch(e=>{console.error('DEBUG FAIL',e.message);process.exit(1);});
