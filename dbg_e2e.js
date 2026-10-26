const puppeteer=require('puppeteer');
(async()=>{
  const browser=await puppeteer.launch({args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:1400,height:900});
  page.on('pageerror',e=>console.log('PAGEERROR:',e.message));
  page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE ERR:',m.text());});
  await page.goto('file:///workspace/index.html',{waitUntil:'load'});
  await new Promise(r=>setTimeout(r,300));

  // --- scenario save: hero mid-evac far from door (simulates user's stuck save)
  const saved={
    _version:8,_location:1,_timestamp:Date.now(),gameOver:false,turn:5,round:1,lastPoiSpawnTurn:1,lastWaveTurn:0,hordeCount:0,
    goldBonus:0,summonDiscount:0,armyAtkBonus:0,armyDefBonus:0,armyMoveBonus:0,pendingLevelUps:0,bossSpawned:false,
    mana:60,gold:100,nextId:10,selection:null,summonMode:false,
    barracks:[],pois:[{q:7,r:-5,kind:'evacuation',looted:false,permanent:true}],
    units:[],enemies:[],projectiles:[],zones:[],books:[],shockZones:[],
    inventory:{equipment:{},backpack:[],stash:[]},
    log:[],
    meta:{gold:0,runsCompleted:0,unknown:[],inventory:{equipment:{},backpack:[],stash:[]},buildings:{barracks:0,archery:0,cavalry:0},forge:{atk:0,def:0},skills:{}}
  };
  // hero with stale evacuating flag
  saved.units.push({id:1,type:'hero',isHero:true,q:0,r:0,hp:60,maxHp:60,atk:10,def:3,baseAtk:10,baseDef:3,baseMaxHp:60,movesLeft:2,maxMoves:2,regen:2,rangeBonus:0,hasMoved:false,exhausted:false,stunnedUntil:0,evacuating:3,evacTotal:5,evacArrivedLogged:true,preferredTargetId:null,autoPath:[],onHold:false,xp:0,level:1,manaBonus:0,weaponRange:2,equipManaBonus:0,skills:{wand:1},passives:{},evolutions:[],skillCDs:{}});
  await page.evaluate(d=>{localStorage.setItem('ht_slot_0',JSON.stringify(d))},saved);
  await page.reload({waitUntil:'load'});
  await new Promise(r=>setTimeout(r,300));

  // continue slot 0
  await page.click('#slots button[data-action="continue"]');
  await new Promise(r=>setTimeout(r,400));
  const appOpen=await page.$eval('#app',el=>el.classList.contains('open'));
  console.log('APP OPEN AFTER CONTINUE:',appOpen);
  const ui1=await page.evaluate(()=>document.getElementById('actions').innerHTML);
  console.log('ACTIONS ON LOAD:',ui1);

  // click end turn repeatedly via real DOM clicks until game over (max 20)
  for(let i=0;i<20;i++){
    const st=await page.evaluate(()=>({over:S.gameOver,anim:isAnimating,turn:S.turn,hq:S.hero.q,hr:S.hero.r,evac:S.hero.evacuating,dist:hexDist(S.hero.q,S.hero.r,EVAC_POS.q,EVAC_POS.r)}));
    console.log('STEP'+i,JSON.stringify(st));
    if(st.over) break;
    if(!st.anim){
      try{ await page.click('#endTurn'); }catch(e){ console.log('CLICK FAIL',e.message); }
    }
    await new Promise(r=>setTimeout(r,700));
  }
  const final=await page.evaluate(()=>({overCls:document.getElementById('over').className,title:document.getElementById('overTitle').textContent}));
  console.log('FINAL:',JSON.stringify(final));
  await page.screenshot({path:'dbg_after.png'});
  await browser.close();
})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
