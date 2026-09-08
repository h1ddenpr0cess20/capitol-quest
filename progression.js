'use strict';
const AUTO_MODES=['Manual','Balanced','Aggressive','Conserve'];
const TALENTS=[{id:'power',name:'Power',desc:'+4 ATK / rank',max:7},{id:'focus',name:'Focus',desc:'+4 MAG, +6 max MP / rank',max:7},{id:'vitality',name:'Vitality',desc:'+24 max HP, +2 DEF / rank',max:7}];
const RELICS={GARDEN:'Living Remedy',TUNNELS:'Copper Circuit',RECORDS:'Certified Seal',ROOFTOPS:'Clear Frequency',STATION:'Transit Badge',VAULT:'Complete Record'};
const freshV5=freshState;
freshState=function(){const s=freshV5();s.expedition={version:6,missions:{},trials:{},talents:{},discovered:{MALL:true},totalXP:0};s.settings={...s.settings,autoMode:0,battleSpeed:1,autoItems:false,autoLimits:true,autoContinue:false,difficulty:'Standard'};s.party.forEach(p=>{p.lvl=1;p.points=0;p.talents={power:0,focus:0,vitality:0};});s.player.x=MAPS.MALL.spawn.x;s.player.y=MAPS.MALL.spawn.y;s.player.dir='right';return s;};
const mergeV5=mergeState;
mergeState=function(dst,src){mergeV5(dst,src);const defaults=freshState();dst.expedition={...defaults.expedition,...src.expedition,missions:{...src.expedition?.missions},trials:{...src.expedition?.trials},discovered:{MALL:true,...src.expedition?.discovered}};dst.settings={...defaults.settings,...src.settings};dst.settings.autoMode=clamp(Number(dst.settings.autoMode)||0,0,3)|0;dst.settings.battleSpeed=[1,2,3].includes(dst.settings.battleSpeed)?dst.settings.battleSpeed:1;dst.settings.difficulty=['Story','Standard','Tactical'].includes(dst.settings.difficulty)?dst.settings.difficulty:'Standard';for(const p of dst.party){p.lvl=clamp(Math.floor(Number(p.lvl)||1),1,20);p.xp=Math.max(0,Number(p.xp)||0);p.points=Math.max(0,Number(p.points) || (src.expedition?0:p.lvl-1));p.talents={power:0,focus:0,vitality:0,...p.talents};for(const t of TALENTS)p.talents[t.id]=clamp(Math.floor(Number(p.talents[t.id])||0),0,t.max);p.hp=clamp(p.hp,0,p.maxHp);p.mp=clamp(p.mp,0,p.maxMp);p.alive=p.hp>0;}for(const [z,m] of Object.entries(dst.expedition.missions)){if(!SIDE_MISSIONS[z]){delete dst.expedition.missions[z];continue;}m.nodes=[...new Set((Array.isArray(m.nodes)?m.nodes:[]).filter(i=>[0,1,2].includes(i)))];m.complete=!!m.complete;}
 if(src.expedition?.version!==6){dst.player={...dst.player,...MAPS[dst.zone].spawn,dir:'right'};dst.defeated={};dst.expedition.version=6;}dst.adventure.visited[dst.zone]=true;
};
function xpRequired(p){return p.lvl>=20?0:100+(p.lvl-1)*45;}
levelCheck=function(p){const levels=[];while(p.lvl<20&&p.xp>=xpRequired(p)){p.xp-=xpRequired(p);p.lvl++;p.points++;p.maxHp+=20;p.maxMp+=7;p.atk+=4;p.def+=2;p.mag+=4;p.luck++;p.hp=p.maxHp;p.mp=p.maxMp;p.alive=true;levels.push(p.lvl);log(p.label+' reached level '+p.lvl+' · +1 talent point');}if(p.lvl>=20)p.xp=0;return levels;};
function grantPartyXP(xp){state.expedition.totalXP+=xp;const gains=[];for(const p of state.party){const before=p.lvl;p.xp+=xp;levelCheck(p);if(p.lvl>before)gains.push({name:p.name,from:before,to:p.lvl});}if(gains.length&&!battle)notify('PARTY LEVEL UP · OPEN P TO SPEND TALENT POINTS');return gains;}
function buyTalent(p,t){if(p.points<1||p.talents[t.id]>=t.max)return;p.points--;p.talents[t.id]++;if(t.id==='power')p.atk+=4;if(t.id==='focus'){p.mag+=4;p.maxMp+=6;p.mp+=6;}if(t.id==='vitality'){p.maxHp+=24;p.hp+=24;p.def+=2;}saveGame(false);sfx('save');notify(p.label+' · '+t.name.toUpperCase()+' '+p.talents[t.id]+'/'+t.max);}
// Distinct unlocks preserve the original per-character moves and animations.
const firstTrump=PARTY_DEFS.TRUMP.skills;PARTY_DEFS.TRUMP.skills=[firstTrump[1],firstTrump[0],firstTrump[2]];
PARTY_DEFS.TRUMP.skills.push({name:'Follow Through',cost:26,target:'enemy',kind:'physical',power:2.05,pose:2,desc:'Heavy hit. Exposes the target for two rounds.'},{name:'Mandate',cost:32,target:'allies',kind:'formation',pose:1,desc:'Raise party ATK and DEF for three rounds.'});
PARTY_DEFS.HEGSETH.skills.push({name:'Pinning Shot',cost:24,target:'enemy',kind:'physical',power:1.8,pose:2,desc:'Strong shot. Lowers enemy ATK for three rounds.'},{name:'Hold Formation',cost:28,target:'allies',kind:'protect',pose:1,desc:'Raise party DEF and shield the next enemy phase.'});
PARTY_DEFS.LUTNICK.skills.push({name:'Arbitration',cost:30,target:'enemies',kind:'hybridAll',power:1.25,pose:2,desc:'Hybrid damage across the entire enemy line.'},{name:'Buyback',cost:36,target:'ally',kind:'revive',pose:0,desc:'Revive one fallen hero with 55% of max HP.'});
PARTY_DEFS.RFK.skills.push({name:'Second Wind',cost:28,target:'ally',kind:'revive',pose:0,desc:'Revive one fallen hero with 55% of max HP.'},{name:'Aurora',cost:36,target:'enemies',kind:'magicAll',power:1.35,pose:2,desc:'A wide wave of magic against every enemy.'});
const SKILL_LEVELS=[1,2,4,6,9];
skillsFor=function(p){const list=PARTY_DEFS[p.name].skills.filter((s,i)=>p.lvl>=SKILL_LEVELS[i]).map(s=>({...s,limit:false}));if(p.limit>=100)list.push({...PARTY_DEFS[p.name].limit,cost:0,limit:true});return list;};
const chooseSkillV5=chooseSkill;
chooseSkill=function(s){if(!s)return;if(s.kind==='revive'&&!state.party.some(p=>!p.alive)){notify('ALL HEROES ARE ALIVE');return;}chooseSkillV5(s);};
battleTargets=function(){if(battle.pending?.targetType==='enemy')return aliveEnemies();if(battle.pending?.skill?.kind==='revive')return state.party.filter(p=>!p.alive);if(battle.pending?.kind==='item'&&ITEMS[battle.pending.item]?.revive)return state.party;return aliveParty();};
Object.assign(ENEMY_DEFS,{
 CURATOR:{label:'The Curator',sprite:'FARMER',hp:340,atk:28,def:12,mag:22,ai:'curator',trait:'Boss • Tough',boss:true},
 ENGINEER:{label:'Relay Engineer',sprite:'SCIENTIST',hp:400,atk:27,def:16,mag:30,ai:'engineer',trait:'Boss • Tech',boss:true},
 AUDITOR:{label:'The Auditor',sprite:'SENIOR',hp:430,atk:30,def:19,mag:30,ai:'auditor',trait:'Boss • Steady',boss:true},
 DIRECTOR:{label:'The Director',sprite:'JOURNALIST',hp:460,atk:31,def:18,mag:37,ai:'director',trait:'Boss • Media',boss:true},
 CONDUCTOR:{label:'The Conductor',sprite:'UNION',hp:500,atk:38,def:22,mag:28,ai:'conductor',trait:'Boss • Guard',boss:true},
 CUSTODIAN:{label:'The Custodian',sprite:'VETERAN',hp:620,atk:40,def:24,mag:38,ai:'custodian',trait:'Boss • Armored',boss:true}
});
const TRIALS=[
 {name:'First Principles',level:2,types:['PROTESTER','STUDENT'],desc:'Two opponents. Learn to exploit weaknesses.',xp:130,gold:90},
 {name:'Steel & Signal',level:4,types:['VETERAN','SCIENTIST'],desc:'Armored and tech enemies both fear magic.',xp:175,gold:130},
 {name:'Press Scramble',level:6,types:['JOURNALIST','NURSE','ACTIVIST'],desc:'Break the healer before it can recover.',xp:225,gold:175},
 {name:'Standing Together',level:8,types:['UNION','VETERAN','NURSE'],desc:'Three resilient targets. Focus your damage.',xp:280,gold:220},
 {name:'Cross Examination',level:10,types:['TEACHER','SCIENTIST','SENIOR'],desc:'Keep your party healthy under magic pressure.',xp:340,gold:280},
 {name:'Night Session',level:12,types:['SENTINEL','FIXER'],desc:'Two bosses at once. Break their charged attacks.',xp:450,gold:360}
];
function beginTrial(i){const t=TRIALS[i];modal=null;startBattle(t.types.map(type=>({type,level:t.level})),{trial:i,xp:t.xp,gold:t.gold,label:'TRIAL · '+t.name});}
makeEnemy=function(spec){const d=ENEMY_DEFS[spec.type],level=clamp(Math.max(spec.level||1,d.boss?Math.round(state.party.reduce((n,p)=>n+p.lvl,0)/state.party.length)-1:1),1,25),scale=.82+(level-1)*.095,difficulty=state.settings.difficulty==='Story'?.76:state.settings.difficulty==='Tactical'?1.18:1;return {type:spec.type,name:d.label,sprite:d.sprite,level,maxHp:Math.round(d.hp*scale*difficulty*(d.boss?2.1:1)),hp:Math.round(d.hp*scale*difficulty*(d.boss?2.1:1)),atk:Math.round(d.atk*(.85+(level-1)*.09)*difficulty),def:Math.round(d.def*(.9+(level-1)*.06)),mag:Math.round(d.mag*(.85+(level-1)*.09)*difficulty),ai:d.ai,trait:d.trait,quote:d.quote||'Keep the record intact.',boss:!!d.boss,status:{},guard:false,analyzed:false};};
const startV5=startBattle;
startBattle=function(specs,reward={}){if(mode==='battle')return;walkPath=[];walkTarget=null;const levels={SENTINEL:4,FIXER:7,CHAIR:9};specs=specs.map(s=>({...s,level:reward.mission||reward.trial!==undefined?s.level:levels[s.type]||s.level}));startV5(specs,reward);battle.autoClock=0;battle.resultClock=0;battle.breaks=0;battle.specs=specs.map(s=>({...s}));if(sideState('RECORDS').complete)state.party.forEach(p=>p.limit=Math.min(100,p.limit+15));};
const actionV5=resolvePlayerAction;
resolvePlayerAction=function(a){const p=a.actor,s=a.skill;
 if(s?.kind==='revive'){const t=a.targets[0];if(t&&!t.alive){t.hp=Math.round(t.maxHp*.55);t.alive=true;t.status={};addFloater(t,'REVIVED','#a5e4ba');sfx('heal');}endPlayerAction();return;}
 if(s&&['formation','protect'].includes(s.kind)){for(const t of a.targets){addStatus(t,'defUp',3);if(s.kind==='formation')addStatus(t,'atkUp',3);else t.guard=true;}addFx('buff',400,310);endPlayerAction();return;}
 const before=aliveEnemies().filter(e=>e.broken).length;actionV5(a);
 if(a.kind==='basic')p.mp=Math.min(p.maxMp,p.mp+5+(sideState('TUNNELS').complete?3:0));
 if(a.kind==='guard')p.mp=Math.min(p.maxMp,p.mp+10);
 if(s?.name==='Follow Through')a.targets.forEach(t=>addStatus(t,'vulnerable',2));
 if(s?.name==='Pinning Shot')a.targets.forEach(t=>addStatus(t,'atkDown',3));
 battle.breaks+=Math.max(0,aliveEnemies().filter(e=>e.broken).length-before);
};
const damageV5=applyDamage;
applyDamage=function(t,res){if(battle?.action&&state.party.includes(battle.action.actor)&&battle.enemies.includes(t)){const kind=attackType(battle.action);let multiplier=kind===weakness(t)?1.16:1;if(kind==='magic'&&sideState('ROOFTOPS').complete)multiplier*=1.1;if(kind==='physical'&&sideState('STATION').complete)multiplier*=1.1;res={...res,amount:Math.round(res.amount*multiplier)};}damageV5(t,res);};
planIntent=function(e){if(e.broken)return {kind:'broken',label:'BROKEN · skips turn',power:0};const round=battle.round;const caster=['teacher','journalist','scientist','fixer','chair','activist','engineer','director','auditor'].includes(e.ai);
 if(e.boss&&round%3===0)return {kind:'sweep',label:'CHARGE · all heroes',power:e.ai==='custodian'?1.35:1.05};
 if(e.ai==='curator'&&round%3===2)return {kind:'drain',label:'Roots · drain HP',power:1.1};
 if(e.ai==='engineer'&&round%3===2)return {kind:'disrupt',label:'EMP · lower MAG',power:1.1};
 if(e.ai==='auditor'&&round%3===2)return {kind:'guard',label:'Audit · raise armor',power:1};
 if(e.hp/e.maxHp<.45&&['nurse','senior'].includes(e.ai))return {kind:'heal',label:'Recover ally HP',power:1};
 if(round%3===2&&['veteran','union','sentinel','conductor'].includes(e.ai))return {kind:'guard',label:'Brace · armor up',power:1};
 return {kind:caster?'magic':'physical',label:e.resolveTurns?'RESOLVE · strike':e.boss&&e.hp/e.maxHp<.4?'FURY · strong strike':caster?'Signal strike':'Physical strike',power:e.boss?(e.hp/e.maxHp<.4?1.5:1.2):1};
};
resolveEnemyAction=function(e){if(e.broken){e.broken=false;if(e.boss)e.resolveTurns=2;e.intent=planIntent(e);battle.message=e.name+' is broken and loses its action.';return;}const move=e.intent||planIntent(e),living=aliveParty();if(!living.length)return loseBattle();battle.message=e.name+': '+move.label+'.';if(move.kind==='guard'){e.guard=true;addStatus(e,'defUp',2);return;}if(move.kind==='heal'){const t=aliveEnemies().sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];const n=Math.min(t.maxHp-t.hp,Math.round(e.maxHp*.2));t.hp+=n;addFloater(t,'+'+n,'#9ee6b8');return;}const targets=move.kind==='sweep'?living:[choice(living)];for(const t of targets){const magic=['magic','disrupt'].includes(move.kind)||(move.kind==='sweep'&&['fixer','chair','director','engineer'].includes(e.ai));const result=magic?damageMagic(e,t,move.power):damagePhysical(e,t,move.power);applyDamage(t,result);if(move.kind==='disrupt')addStatus(t,'magDown',2);if(move.kind==='drain')e.hp=Math.min(e.maxHp,e.hp+Math.round(result.amount*.6));addFx(magic?'magic':'hit',partyPos(t).x,partyPos(t).y-65);}if(!aliveParty().length)loseBattle();};
winBattle=function(){if(!battle||battle.phase==='victory')return;const r=battle.reward,practice=!!r.practice,multi=r.mission==='VAULT'&&r.wave<2;const level=Math.max(...battle.enemies.map(e=>e.level));const xp=practice?0:multi?100:r.xp??(r.boss?140+level*24:50+level*18+battle.enemies.length*10),gold=practice?0:multi?0:r.gold??50;state.cash+=gold;const gains=practice?[]:grantPartyXP(xp);if(!practice){adv().battles++;state.party.forEach(p=>p.limit=Math.min(100,p.limit+18));}if(r.worldMob)state.defeated[r.worldMob]=true;
 let relic=null;if(r.mission&&!multi&&!sideState(r.mission).complete){sideState(r.mission).complete=true;relic=SIDE_MISSIONS[r.mission].relic;if(r.mission==='VAULT')state.party.forEach(p=>p.points+=2);log('Mission complete: '+SIDE_MISSIONS[r.mission].title+' · '+relic);}
 if(r.trial!==undefined){const prev=state.expedition.trials[r.trial];const stars=battle.round<=4&&aliveParty().length===4?3:aliveParty().length===4?2:1;state.expedition.trials[r.trial]=Math.max(prev||0,stars);}
 if(r.boss==='SENTINEL'&&!r.mission&&r.trial===undefined){state.flags.sentinel=true;setStage(4);}if(r.boss==='FIXER'&&!r.mission&&r.trial===undefined)state.flags.fixer=true;if(r.boss==='CHAIR'){state.flags.chair=true;setStage(8);}
 battle.phase='victory';battle.result={xp,gold,gains,relic,multi,rounds:battle.round,breaks:battle.breaks};battle.resultClock=0;battle.message=practice?'PRACTICE CLEARED':multi?'SECURITY WAVE CLEARED':'VICTORY · +'+xp+' XP · +'+gold+' CASH';if(!practice)saveGame(false);sfx('victory');
};
const finishV5=finishBattle;
finishBattle=function(won,escaped){if(!battle)return;const r={...battle.reward};if(won&&r.mission==='VAULT'&&r.wave<2){state.party.forEach(p=>{p.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*.18));p.mp=Math.min(p.maxMp,p.mp+Math.round(p.maxMp*.15));p.alive=p.hp>0;p.status={};});battle=null;mode='world';startBattle([{type:r.wave===0?'FIXER':'CUSTODIAN',level:DISTRICTS.VAULT.level}],{...r,wave:r.wave+1});return;}
 const practice=battle.reward.practice;if(practice){const saved=battle.practiceParty,inv=battle.practiceInventory;battle=null;mode='world';state.party=JSON.parse(JSON.stringify(saved));state.inventory={...inv};encounterGrace=3;saveGame(false);return;}
 if(won&&sideState('GARDEN').complete)state.party.forEach(p=>p.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*.06)));
 finishV5(won,escaped);
};
retreat=function(){if(battle?.reward.practice){finishBattle(false,true);return;}restoreParty();battle=null;mode='world';state.player={...state.player,x:REST[state.zone].x,y:REST[state.zone].y+50};walkPath=[];recoverPlayerPosition();resetTrail();encounterGrace=3;saveGame(false);};
retryBattle=function(){const specs=battle.specs.map(s=>({...s})),reward={...battle.reward};if(reward.practice){finishBattle(false,true);startBattle(specs,reward);return;}restoreParty();battle=null;mode='world';startBattle(specs,reward);};
function cycleAuto(){state.settings.autoMode=(state.settings.autoMode+1)%AUTO_MODES.length;if(battle&&['skills','target','items','analyze'].includes(battle.phase)){battle.phase='input';battle.pending=null;}if(battle)battle.autoClock=0;notify('AUTO-BATTLE · '+AUTO_MODES[state.settings.autoMode].toUpperCase());}
function setAutoMode(n){state.settings.autoMode=n;if(battle){battle.autoClock=0;if(['skills','target','items','analyze'].includes(battle.phase)){battle.phase='input';battle.pending=null;}}}
function chooseAutoAction(){const p=currentActor();if(!p?.alive){advancePlayer();return;}const settings=state.settings,strategy=settings.autoMode,enemies=aliveEnemies(),allies=aliveParty();if(!enemies.length){winBattle();return;}const affordable=skillsFor(p).filter(s=>s.limit?settings.autoLimits:s.cost<=p.mp),hurt=[...allies].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0],fallen=state.party.find(t=>!t.alive),casts=(s,ts)=>beginPlayerAction({kind:'skill',actor:p,skill:s,targets:ts,pose:s.pose});
 const revive=affordable.find(s=>s.kind==='revive');if(fallen&&revive){casts(revive,[fallen]);return;}if(fallen&&settings.autoItems&&state.inventory.MEDKIT){beginPlayerAction({kind:'item',actor:p,item:'MEDKIT',target:fallen,pose:0});return;}
 const healing=affordable.filter(s=>/^heal/.test(s.kind));const low=allies.filter(t=>t.hp/t.maxHp<(strategy===2?.4:.65));if(low.length>=2){const aoe=healing.find(s=>s.kind.includes('All'));if(aoe){casts(aoe,allies);return;}}
 if(hurt.hp/hurt.maxHp<(strategy===2?.28:.52)){const heal=healing.find(s=>!s.kind.includes('All'))||healing[0];if(heal){casts(heal,heal.target==='allies'?allies:[hurt]);return;}if(settings.autoItems){const key=state.inventory.SUPER?'SUPER':state.inventory.POTION?'POTION':state.inventory.MEDKIT?'MEDKIT':null;if(key){beginPlayerAction({kind:'item',actor:p,item:key,target:hurt,pose:0});return;}}}
 const charging=enemies.some(e=>!e.broken&&e.intent?.kind==='sweep');if(strategy!==2&&charging&&p.hp/p.maxHp<.65){beginPlayerAction({kind:'guard',actor:p,pose:1});return;}
 const hitType=p.name==='RFK'?'magic':p.name==='LUTNICK'?'hybrid':'physical';let target=[...enemies].sort((a,b)=>((weakness(b)===hitType?2:0)+(b.breakPoints||0)*2+(1-b.hp/b.maxHp))-((weakness(a)===hitType?2:0)+(a.breakPoints||0)*2+(1-a.hp/a.maxHp)))[0];
 const offensive=affordable.filter(s=>/^(physical|hybrid|magic)/.test(s.kind));const limit=offensive.find(s=>s.limit);if(limit){casts(limit,limit.target==='enemies'?enemies:[target]);return;}
 if(strategy!==3){if(battle.round===1&&enemies.some(e=>e.boss)&&p.name==='TRUMP'&&!p.status.atkUp){const buff=affordable.find(s=>['buffAtk','formation'].includes(s.kind));if(buff){casts(buff,allies);return;}}
 const reserve=strategy===1?p.maxMp*.18:0;const attack=offensive.filter(s=>p.mp-s.cost>=reserve).sort((a,b)=>{const score=s=>s.power*(s.target==='enemies'?enemies.length*.86:1)*(weakness(target)===s.kind.replace('All','')?1.16:1);return score(b)-score(a);})[0];if(attack){casts(attack,attack.target==='enemies'?enemies:[target]);return;}}
 beginPlayerAction({kind:'basic',actor:p,target,pose:BASIC_POSE[p.name]});
}
const battleUpdateV5=updateBattle;
updateBattle=function(dt){const speed=state.settings.battleSpeed||1;battleUpdateV5(dt*speed);if(!battle)return;if(battle.phase==='input'&&state.settings.autoMode){battle.autoClock+=dt*speed;if(battle.autoClock>=.42){battle.autoClock=0;chooseAutoAction();}}else battle.autoClock=0;if(battle.phase==='message'&&!battle.pending?.advanceAfterMessage&&state.settings.autoMode){battle.phase='input';battle.pending=null;}if(battle.phase==='victory'&&state.settings.autoContinue&&state.settings.autoMode&&!battle.result?.gains.length&&!battle.result?.relic&&!battle.reward.boss){battle.resultClock+=dt;if(battle.resultClock>1.5)finishBattle(true,false);}};
const battleInputV5=battleInput;
battleInput=function(k){if(k==='b'){cycleAuto();return;}if(k==='v'){state.settings.battleSpeed=state.settings.battleSpeed%3+1;return;}if(k==='escape'&&state.settings.autoMode){setAutoMode(0);notify('MANUAL CONTROL');return;}battleInputV5(k);};
const handleV5=handleInput;
handleInput=function(k){if(modal||overlay){handleV5(k);return;}if(mode==='world'&&k==='p'){modal={type:'talents',selection:0};return;}if(mode==='world'&&k==='b'){modal={type:'automation',selection:0};return;}if(mode==='world'&&k==='escape')walkPath=[];handleV5(k);};
Object.assign(state,freshState());recoverPlayerPosition();resetTrail();

const resolveRoundV6=startEnemyAction;
startEnemyAction=function(){const before=battle.round;resolveRoundV6();if(battle&&battle.round!==before){battle.enemies.forEach(e=>{e.resolveTurns=Math.max(0,(e.resolveTurns||0)-1);});refreshIntents();}};
