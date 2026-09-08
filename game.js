'use strict';

/*
  CAPITOL QUEST — WORK IN PROGRESS
  Canvas RPG built around the supplied sprite atlas.
  The story is fictional satire. No event or allegation in the game is presented as factual.
*/

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const W = canvas.width, H = canvas.height;
const WORLD_VIEW_H = 548;
const BATTLE_VIEW_H = 470;
const VERSION = 'WIP';
const SAVE_KEY = 'capitol_quest_v6';
const PREVIOUS_SAVE_KEY = 'capitol_quest_v5';
const LEGACY_KEY = 'capitol_quest_rebuilt_v2';
const storageGet = key => { try { return localStorage.getItem(key); } catch(e) { return null; } };
const storageSet = (key,value) => { try { localStorage.setItem(key,value); return true; } catch(e) { return false; } };

const atlas = new Image();
let atlasReady = false;
atlas.onload = () => { atlasReady = true; };
atlas.src = 'assets/atlas.png';

// Pixel-perfect actor sheet extracted from the supplied atlas. Frames are transparent and carry per-frame foot anchors.
const actorAtlas = new Image();
let actorAtlasReady = false;
actorAtlas.onload = () => { actorAtlasReady = true; };
actorAtlas.src = 'assets/actors.png';
const ACT = {"walk":{"TRUMP":[{"r":[2,2,53,77],"a":[34.0,77.0]},{"r":[59,2,51,75],"a":[30.5,75.0]},{"r":[114,2,47,74],"a":[18.0,74.0]},{"r":[165,2,46,73],"a":[18.5,73.0]},{"r":[215,2,42,73],"a":[22.0,73.0]},{"r":[261,2,48,73],"a":[27.0,73.0]}],"HEGSETH":[{"r":[313,2,50,82],"a":[21.0,82.0]},{"r":[367,2,57,84],"a":[36.0,84.0]},{"r":[428,2,46,85],"a":[18.0,85.0]},{"r":[478,2,44,85],"a":[20.0,85.0]},{"r":[526,2,42,86],"a":[21.0,86.0]},{"r":[572,2,48,86],"a":[24.0,86.0]}],"LUTNICK":[{"r":[624,2,55,83],"a":[22.0,83.0]},{"r":[683,2,54,81],"a":[23.0,81.0]},{"r":[741,2,54,78],"a":[21.0,78.0]},{"r":[799,2,48,78],"a":[23.0,78.0]},{"r":[851,2,44,78],"a":[23.0,78.0]},{"r":[899,2,50,79],"a":[24.0,79.0]}],"RFK":[{"r":[953,2,56,97],"a":[22.0,97.0]},{"r":[2,103,56,97],"a":[15.0,97.0]},{"r":[62,103,48,99],"a":[14.0,99.0]},{"r":[114,103,47,97],"a":[18.0,97.0]},{"r":[165,103,50,92],"a":[24.0,92.0]},{"r":[219,103,50,95],"a":[27.0,95.0]}]},"action":{"TRUMP":[{"r":[273,103,69,76],"a":[42.0,76.0]},{"r":[346,103,78,77],"a":[42.0,77.0]},{"r":[428,103,116,76],"a":[41.0,76.0]}],"HEGSETH":[{"r":[548,103,65,82],"a":[34.0,82.0]},{"r":[617,103,84,78],"a":[35.0,78.0]},{"r":[705,103,123,75],"a":[41.0,75.0]}],"LUTNICK":[{"r":[832,103,63,82],"a":[35.5,82.0]},{"r":[899,103,80,80],"a":[36.0,80.0]},{"r":[2,206,133,85],"a":[44.0,85.0]}],"RFK":[{"r":[139,206,80,97],"a":[40.0,97.0]},{"r":[223,206,75,87],"a":[39.0,87.0]},{"r":[302,206,131,109],"a":[39.0,109.0]}]},"enemy":{"PROTESTER":{"r":[437,206,97,105],"a":[30.0,105.0]},"ACTIVIST":{"r":[538,206,78,101],"a":[55.0,101.0]},"VETERAN":{"r":[620,206,72,102],"a":[47.0,102.0]},"TEACHER":{"r":[696,206,71,105],"a":[37.0,105.0]},"JOURNALIST":{"r":[771,206,83,126],"a":[45.0,126.0]},"UNION":{"r":[858,206,82,122],"a":[38.0,122.0]},"FARMER":{"r":[2,336,82,129],"a":[44.0,129.0]},"STUDENT":{"r":[88,336,63,114],"a":[37.0,114.0]},"SENIOR":{"r":[155,336,82,126],"a":[34.0,126.0]},"NURSE":{"r":[241,336,67,126],"a":[46.0,126.0]},"SCIENTIST":{"r":[312,336,66,126],"a":[39.0,126.0]},"EVERYDAY":{"r":[382,336,77,124],"a":[26.5,124.0]}},"npc":{"CIV1":{"r":[463,336,38,62],"a":[18.0,62.0]},"CIV2":{"r":[505,336,39,61],"a":[19.0,61.0]},"COP1":{"r":[548,336,41,66],"a":[18.0,66.0]},"COP2":{"r":[593,336,40,66],"a":[20.0,66.0]},"POL1":{"r":[637,336,41,75],"a":[17.0,75.0]},"POL2":{"r":[682,336,42,75],"a":[21.5,75.0]}}};

const landmarkAtlas = new Image();
let landmarkAtlasReady = false;
landmarkAtlas.onload = () => { landmarkAtlasReady = true; };
landmarkAtlas.src = 'assets/landmarks.png';
const LAND = {"WHITEHOUSE":[2,2,79,76],"CAPITOL":[85,2,58,116],"MONUMENT":[147,2,50,136],"FOUNTAIN":[201,2,38,62],"TREE":[243,2,43,61]};


// Correct, tile-aligned background art from the original atlas. Integer scaling only.
const BG = {
  WHITEHOUSE:[1280,180,96,128], CAPITOL:[1376,180,96,128], MONUMENT:[1472,180,64,128],
  FOUNTAIN:[1344,276,32,64], ARCH:[1408,308,32,32], TREE:[1504,52,32,64], HEDGE:[1504,116,32,64]
};

const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const lerp = (a,b,t) => a+(b-a)*t;
const choice = a => a[Math.floor(Math.random()*a.length)];
const randInt = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const rectContains = (r,x,y,m=0) => x>r.x-m && x<r.x+r.w+m && y>r.y-m && y<r.y+r.h+m;

const A = {
  party: {
    TRUMP:   [[71,47,52,76],[136,48,50,75],[197,50,47,73],[255,50,44,72],[313,52,41,72],[369,52,47,72]],
    HEGSETH: [[72,138,49,82],[131,137,56,84],[195,139,46,83],[254,138,43,84],[310,139,41,84],[365,139,47,85]],
    LUTNICK: [[67,234,54,82],[129,237,53,80],[192,240,52,77],[250,241,46,78],[306,242,43,78],[361,241,48,79]],
    RFK:     [[67,329,54,96],[129,331,56,97],[192,331,47,99],[250,335,47,95],[305,337,50,91],[366,337,49,94]]
  },
  // Crops include the character-specific effect attached to the third pose where the atlas supplies one.
  actions: {
    TRUMP:   [[451,52,70,85],[522,53,78,85],[607,51,123,89]],
    HEGSETH: [[449,148,73,85],[519,148,92,86],[607,147,125,87]],
    LUTNICK: [[447,243,74,85],[516,243,92,85],[601,242,130,88]],
    RFK:     [[447,339,75,98],[517,339,94,98],[600,337,133,101]]
  },
  enemies: {
    PROTESTER:[763,58,97,105], ACTIVIST:[876,64,77,99], VETERAN:[976,60,71,101], TEACHER:[1067,58,71,105],
    JOURNALIST:[755,196,82,125], UNION:[862,197,80,122], FARMER:[964,191,80,128], STUDENT:[1067,204,62,113],
    SENIOR:[765,350,81,124], NURSE:[862,348,66,126], SCIENTIST:[960,348,65,125], EVERYDAY:[1056,350,77,123]
  },
  npc: {
    CIV1:[1172,68,37,61], CIV2:[1220,70,37,60], COP1:[1170,166,39,65], COP2:[1217,167,40,65],
    POL1:[1171,279,39,73], POL2:[1215,279,42,73]
  },
  portraits: {
    TRUMP:[20,505,117,145], HEGSETH:[138,505,119,145], LUTNICK:[257,505,116,145], RFK:[375,505,118,145],
    PROTESTER:[21,678,115,143], UNION:[138,678,115,143], TEACHER:[255,678,116,144], VETERAN:[373,678,119,144]
  },
  items: {
    POTION:[932,526,24,40], SUPER:[992,525,25,41], MEGA:[1041,528,46,34], MEDKIT:[1110,528,36,36],
    STEAK:[922,611,45,36], ADDE:[984,609,39,38], CASH:[1039,608,53,40], DOC:[1106,607,39,44],
    SERUM:[930,688,26,48], BURGER:[983,694,41,42], FILE:[1041,694,44,42], USB:[1102,697,40,39]
  },
  landmark: {
    WHITEHOUSE:[1276,178,90,118], CAPITOL:[1348,171,112,183], MONUMENT:[1442,171,92,200],
    FOUNTAIN:[1318,282,58,91], ARCH:[1382,299,72,74], TREE:[1481,48,50,81]
  },
  interior: {
    PLANT:[1170,442,43,66], PLANTS:[1215,450,66,55], POTPLANT:[1285,443,48,67],
    THRONE:[1344,469,71,124], SEAL:[1407,440,72,70], DOOR:[1476,409,59,111],
    FLAG:[1425,487,43,105], BUST:[1360,505,55,99], CHAIR:[1320,509,47,85]
  }
};

// Battle-effect strips from the supplied atlas. These are animated on top of the action poses.
A.effects = {
  hit:[[632,513,29,29],[666,512,28,32],[699,511,33,37],[734,510,35,40],[773,510,35,41],[811,511,35,39],[850,512,35,38]],
  gun:[[609,558,64,52],[682,569,25,15],[716,560,55,39],[771,570,26,14],[807,570,28,14],[844,570,28,14],[882,570,28,14]],
  money:[[608,611,27,30],[642,599,28,30],[680,616,30,25],[719,601,27,35],[757,595,28,38],[795,607,30,35],[849,604,29,39]],
  heal:[[632,651,42,44],[682,637,35,40],[718,647,29,34],[757,638,36,40],[799,650,35,39],[838,631,55,58]],
  explosion:[[607,690,61,60],[674,689,63,62],[746,688,65,62],[817,690,63,60]],
  debuff:[[609,750,47,45],[672,754,35,35],[723,746,48,46],[785,750,45,44],[840,752,42,42]],
  buff:[[581,797,24,21],[606,785,28,31],[637,795,34,37],[674,782,28,35],[708,798,22,22],[738,791,27,31],[768,781,44,51],[822,784,43,49],[870,797,31,31]]
};

// Source-pixel foot anchors keep wide action crops (muzzle flash, money, energy arc) from shifting the character.
const ACTION_ANCHOR = {
  TRUMP:[35,39,31], HEGSETH:[36,38,39], LUTNICK:[35,34,34], RFK:[36,37,35]
};
const BASIC_POSE = {TRUMP:0,HEGSETH:2,LUTNICK:1,RFK:1};
const BATTLE_IDLE_POSE = {TRUMP:0,HEGSETH:0,LUTNICK:0,RFK:0};
const BATTLE_SCALE = {TRUMP:1.65,HEGSETH:1.55,LUTNICK:1.58,RFK:1.38};
const WORLD_PARTY_SCALE = 1.10;
const WALK = { down:[0,1,2,1], right:[3,3,3,3], up:[4,5,4,5], left:[3,3,3,3] };

const PARTY_DEFS = {
  TRUMP:{label:'TRUMP', maxHp:320,maxMp:80,atk:38,def:18,mag:13,luck:12,
    skills:[
      {name:'Rallying Cry',cost:16,target:'allies',kind:'buffAtk',pose:1,desc:'Raise party ATK for 3 rounds.'},
      {name:'Hard Push',cost:12,target:'enemy',kind:'physical',power:1.45,pose:0,desc:'Heavy single-target physical hit.'},
      {name:'Golden Gut',cost:20,target:'ally',kind:'heal',power:1.05,pose:1,desc:'Restore one ally and remove ATK Down.'}
    ], limit:{name:'Trump Card',target:'enemies',kind:'physicalAll',power:1.45,pose:2,desc:'A sweeping attack against all enemies.'}},
  HEGSETH:{label:'HEGSETH',maxHp:280,maxMp:60,atk:35,def:23,mag:10,luck:16,
    skills:[
      {name:'Field Shot',cost:12,target:'enemy',kind:'physical',power:1.35,crit:.28,pose:2,desc:'Accurate shot with a high critical rate.'},
      {name:'Brace',cost:14,target:'self',kind:'buffDef',pose:1,desc:'Raise DEF and reduce the next hit.'},
      {name:'Covering Fire',cost:22,target:'enemies',kind:'physicalAll',power:.88,pose:2,desc:'Hit every enemy.'}
    ], limit:{name:'Last Stand',target:'enemy',kind:'physical',power:2.25,crit:.35,pose:2,desc:'Massive single-target shot.'}},
  LUTNICK:{label:'LUTNICK',maxHp:260,maxMp:100,atk:29,def:16,mag:27,luck:22,
    skills:[
      {name:'Market Swing',cost:16,target:'enemy',kind:'hybrid',power:1.45,pose:1,desc:'Hybrid attack using ATK and MAG.'},
      {name:'Cashout',cost:20,target:'allies',kind:'healAll',power:.63,pose:0,desc:'Restore HP to the whole party.'},
      {name:'Money Rain',cost:26,target:'enemies',kind:'magicAll',power:.96,pose:2,desc:'Damage all enemies and may lower DEF.'}
    ], limit:{name:'Hostile Takeover',target:'enemies',kind:'hybridAll',power:1.60,pose:2,desc:'Large hybrid damage to every enemy.'}},
  RFK:{label:'RFK JR.',maxHp:240,maxMp:140,atk:24,def:14,mag:38,luck:18,
    skills:[
      {name:'Green Spark',cost:14,target:'ally',kind:'healRegen',power:1.10,pose:0,desc:'Heal one ally and grant regeneration.'},
      {name:'Clean Signal',cost:22,target:'enemy',kind:'magic',power:1.45,pose:1,desc:'Focused magic damage; strong vs. tech.'},
      {name:'Signal Cascade',cost:30,target:'allies',kind:'buffMag',pose:2,desc:'Raise party MAG and restore some MP.'}
    ], limit:{name:'Resonance',target:'allies',kind:'healAllCleanse',power:1.55,pose:2,desc:'Large party heal and cleanse all debuffs.'}}
};

const ENEMY_DEFS = {
  PROTESTER:{label:'Protester',sprite:'PROTESTER',hp:150,atk:23,def:9,mag:12,ai:'protester',trait:'Crowd',quote:'NO KINGS!'},
  ACTIVIST:{label:'Activist',sprite:'ACTIVIST',hp:165,atk:24,def:9,mag:18,ai:'activist',trait:'Crowd',quote:'READ THE SOURCE!'},
  VETERAN:{label:'Veteran',sprite:'VETERAN',hp:225,atk:31,def:18,mag:8,ai:'veteran',trait:'Armored',quote:'HOLD THE LINE.'},
  TEACHER:{label:'Teacher',sprite:'TEACHER',hp:170,atk:20,def:10,mag:26,ai:'teacher',trait:'Scholar',quote:'CITE YOUR SOURCE.'},
  JOURNALIST:{label:'Journalist',sprite:'JOURNALIST',hp:155,atk:22,def:8,mag:29,ai:'journalist',trait:'Media',quote:'ON THE RECORD.'},
  UNION:{label:'Union Worker',sprite:'UNION',hp:215,atk:30,def:15,mag:10,ai:'union',trait:'Guard',quote:'STAND TOGETHER.'},
  FARMER:{label:'Farmer',sprite:'FARMER',hp:205,atk:29,def:13,mag:10,ai:'farmer',trait:'Tough',quote:'BACK TO WORK.'},
  STUDENT:{label:'Student',sprite:'STUDENT',hp:145,atk:20,def:8,mag:21,ai:'student',trait:'Quick',quote:'PROVE IT.'},
  SENIOR:{label:'Senior',sprite:'SENIOR',hp:180,atk:20,def:14,mag:18,ai:'senior',trait:'Steady',quote:'I HAVE SEEN ENOUGH.'},
  NURSE:{label:'Nurse',sprite:'NURSE',hp:170,atk:18,def:11,mag:30,ai:'nurse',trait:'Medic',quote:'STAY WITH ME.'},
  SCIENTIST:{label:'Scientist',sprite:'SCIENTIST',hp:185,atk:20,def:10,mag:36,ai:'scientist',trait:'Tech',quote:'CHECK THE DATA.'},
  EVERYDAY:{label:'Everyday American',sprite:'EVERYDAY',hp:190,atk:25,def:12,mag:15,ai:'everyday',trait:'Balanced',quote:'ENOUGH ALREADY.'},
  SENTINEL:{label:'Capitol Sentinel',sprite:'VETERAN',hp:460,atk:39,def:24,mag:21,ai:'sentinel',trait:'Boss • Armored',quote:'ACCESS DENIED.',boss:true},
  FIXER:{label:'Media Fixer',sprite:'JOURNALIST',hp:520,atk:34,def:15,mag:40,ai:'fixer',trait:'Boss • Media',quote:'CUT THE FEED.',boss:true},
  CHAIR:{label:'Committee Chair',sprite:'TEACHER',hp:650,atk:41,def:22,mag:46,ai:'chair',trait:'Boss • Scholar',quote:'ORDER IN THE CHAMBER.',boss:true}
};

const ITEMS = {
  POTION:{name:'Potion',desc:'Restore 80 HP.',heal:80,price:28},
  SUPER:{name:'Super Potion',desc:'Restore 160 HP.',heal:160,price:58},
  MEDKIT:{name:'Medkit',desc:'Revive or restore 280 HP.',heal:280,revive:true,price:95},
  STEAK:{name:'Steak',desc:'Restore 120 HP.',heal:120,price:44},
  BURGER:{name:'Burger',desc:'Restore 60 HP.',heal:60,price:22},
  SERUM:{name:'Freedom Serum',desc:'Restore 75 MP.',mp:75,price:48}
};

const BOSS_SCENES = {
  SENTINEL:[
    {speaker:'NARRATOR',text:'The relay key clears the checkpoint. The Sentinel log shows the same hand-off code repeated beside an archive transfer: RED-17.'},
    {speaker:'HEGSETH',portrait:'HEGSETH',text:'That gives us a route, not a conclusion. We follow RED-17 to the original ledger and compare every hand-off.'},
    {speaker:'NARRATOR',text:'The east passage opens. The Public Archive is now reachable.'}
  ],
  FIXER:[
    {speaker:'NARRATOR',text:'The control room comes back online. Its queue contains a clipped broadcast copy, but the source locker still holds the untouched transcript.'},
    {speaker:'LUTNICK',portrait:'LUTNICK',text:'The ledger tells us who handled the record. The transcript tells us what changed. We need both verified before the hearing.'},
    {speaker:'NARRATOR',text:'Recover the source transcript, then take both originals to the Fact Checker.'}
  ],
  CHAIR:[
    {speaker:'NARRATOR',text:'The gavel falls. The verified chain of custody is entered into the hearing record without breaking the source trail.'},
    {speaker:'TRUMP',portrait:'TRUMP',text:'We have the complete record. Now the last choice is procedure: publish it immediately, or file it with the hearing first.'},
    {speaker:'NARRATOR',text:'Approach the Public Record at the center aisle to choose the ending.'}
  ]
};

const MAIN_STAGES = [
  {title:'A Missing Voice',desc:'Speak with the Protester at the Mall rally.'},
  {title:'The Service Route',desc:'Interview the Veteran and Teacher about the missing megaphone.'},
  {title:'Recover the Megaphone',desc:'Search the service yard on the Capitol Grounds.'},
  {title:'The Locked Rotunda',desc:'Enter the Capitol and defeat the Sentinel.'},
  {title:'The Red Ledger',desc:'Reach the Public Archive and secure the original ledger.'},
  {title:'The Missing Transcript',desc:'Reach the Broadcast Center, defeat the Fixer, and open the source locker.'},
  {title:'Chain of Custody',desc:'Bring the ledger and transcript to the Fact Checker.'},
  {title:'The Final Hearing',desc:'Enter the hearing chamber and defeat the Committee Chair.'},
  {title:'The Public Record',desc:'Choose what happens to the complete source record.'},
  {title:'After the Broadcast',desc:'The case is closed. Explore, finish side objectives, or start again.'}
];

const MAPS = {
  MALL:{name:'NATIONAL MALL',w:2200,h:1420,spawn:{x:320,y:970},theme:'outdoor',subtitle:'Rally tents • museums • reflecting pool'},
  GROUNDS:{name:'CAPITOL GROUNDS',w:1960,h:1380,spawn:{x:210,y:1030},theme:'outdoor',subtitle:'Service yard • east lawn • visitor gate'},
  ROTUNDA:{name:'CAPITOL INTERIOR',w:1620,h:1180,spawn:{x:810,y:1040},theme:'interior',subtitle:'Marble hall • rotunda • archive passage'},
  ARCHIVE:{name:'PUBLIC ARCHIVE',w:1880,h:1320,spawn:{x:180,y:1080},theme:'archive',subtitle:'Stacks • reading room • red-file vault'},
  PRESS:{name:'BROADCAST CENTER',w:1760,h:1220,spawn:{x:170,y:1010},theme:'press',subtitle:'Newsroom • source locker • fact desk'},
  HEARING:{name:'HEARING CHAMBER',w:1460,h:1080,spawn:{x:730,y:950},theme:'hearing',subtitle:'Public gallery • committee dais'}
};

const NPCS = {
  MALL:[
    {id:'protester',x:610,y:650,sprite:'PROTESTER',name:'Protester',portrait:'PROTESTER'},
    {id:'veteran',x:960,y:900,sprite:'VETERAN',name:'Veteran',portrait:'VETERAN'},
    {id:'teacher',x:1240,y:770,sprite:'TEACHER',name:'Teacher',portrait:'TEACHER'},
    {id:'student',x:1510,y:930,sprite:'STUDENT',name:'Student',portrait:null},
    {id:'nurse',x:1710,y:610,sprite:'NURSE',name:'Nurse',portrait:null},
    {id:'vendor',x:530,y:1135,sprite:'CIV2',name:'Quartermaster',portrait:null}
  ],
  GROUNDS:[
    {id:'gateOfficer',x:660,y:830,sprite:'COP1',name:'Gate Officer',portrait:null},
    {id:'scientist',x:1190,y:1000,sprite:'SCIENTIST',name:'Scientist',portrait:null},
    {id:'civilian',x:1500,y:760,sprite:'CIV1',name:'Visitor',portrait:null}
  ],
  ROTUNDA:[
    {id:'clerk',x:470,y:810,sprite:'POL1',name:'Capitol Clerk',portrait:null},
    {id:'guard2',x:1170,y:800,sprite:'COP2',name:'Security Officer',portrait:null}
  ],
  ARCHIVE:[
    {id:'archivist',x:420,y:960,sprite:'TEACHER',name:'Archivist',portrait:'TEACHER'},
    {id:'journalist',x:1450,y:840,sprite:'JOURNALIST',name:'Reporter',portrait:null},
    {id:'organizer',x:980,y:1080,sprite:'UNION',name:'Organizer',portrait:'UNION'}
  ],
  PRESS:[
    {id:'editor',x:470,y:900,sprite:'JOURNALIST',name:'Editor',portrait:null},
    {id:'factchecker',x:980,y:900,sprite:'TEACHER',name:'Fact Checker',portrait:'TEACHER'},
    {id:'producer',x:1410,y:760,sprite:'ACTIVIST',name:'Producer',portrait:null}
  ],
  HEARING:[
    {id:'marshal',x:410,y:840,sprite:'COP2',name:'Chamber Marshal',portrait:null},
    {id:'observer',x:1060,y:840,sprite:'CIV1',name:'Observer',portrait:null}
  ]
};

const WORLD_ENCOUNTERS = {
  MALL:[
    {id:'m1',x:1790,y:1040,type:'ACTIVIST',level:3},{id:'m2',x:1880,y:560,type:'STUDENT',level:3},{id:'m3',x:1380,y:1130,type:'EVERYDAY',level:3}
  ],
  GROUNDS:[
    {id:'g1',x:1020,y:1080,type:'VETERAN',level:4},{id:'g2',x:1540,y:1200,type:'UNION',level:4},{id:'g3',x:1690,y:600,type:'FARMER',level:4}
  ],
  ARCHIVE:[
    {id:'a1',x:760,y:960,type:'JOURNALIST',level:5},{id:'a2',x:1190,y:720,type:'SCIENTIST',level:5},{id:'a3',x:1500,y:1040,type:'TEACHER',level:5}
  ],
  PRESS:[
    {id:'p1',x:700,y:770,type:'JOURNALIST',level:6},{id:'p2',x:1240,y:610,type:'ACTIVIST',level:6}
  ]
};

const state = freshState();
function freshState(){
  return {
    started:false, zone:'MALL', chapter:1, mainStage:0, playTime:0,
    player:{x:MAPS.MALL.spawn.x,y:MAPS.MALL.spawn.y,dir:'down',frame:0,step:0,speed:205},
    party:Object.entries(PARTY_DEFS).map(([name,d])=>({name,label:d.label,lvl:3,xp:0,hp:d.maxHp,maxHp:d.maxHp,mp:d.maxMp,maxMp:d.maxMp,atk:d.atk,def:d.def,mag:d.mag,luck:d.luck,limit:0,alive:true,status:{}})),
    inventory:{POTION:4,SUPER:2,MEDKIT:1,STEAK:1,BURGER:2,SERUM:2}, cash:140,
    flags:{veteranClue:false,teacherClue:false,megaphone:false,sentinel:false,ledger:false,fixer:false,transcript:false,factChecked:false,chair:false,ending:false},
    witnesses:{protester:false,veteran:false,teacher:false,student:false,nurse:false,scientist:false,journalist:false,organizer:false,editor:false,producer:false},
    evidence:{usb:0,files:0}, defeated:{}, opened:{}, log:[],
    settings:{sound:true,shake:true}, endingChoice:null,
    adventure:{breakers:[],catalog:[],archiveCode:[],archiveOpen:false,channel:[0,0,0],channelOpen:false,briefs:[],upgrades:{},chests:{},visited:{MALL:true},battles:0}
  };
}

let mode = 'title';
let titleSelection = 0;
let pauseSelection = 0;
let overlay = null; // 'map' | 'quests' | 'controls'
let dialogue = null;
let shop = null;
let cutscene = null;
let battle = null;
let ending = null;
let toast = {text:'',time:0};
let camera = {x:0,y:0};
let particles = [];
let spriteFx = [];
let floaters = [];
let screenShake = 0;
let transition = {alpha:0,dir:0,callback:null};
let last = performance.now();
let totalTime = 0;
let trail = [];
let trailDistance = 0;
let lastTrailPoint = {x:state.player.x,y:state.player.y,dir:'down'};
let worldMobMotion = {};
let encounterGrace = 0;

/* ---------- Audio ---------- */
let audioCtx = null;
function initAudio(){
  if(audioCtx || !state.settings.sound) return;
  try { audioCtx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e) {}
}
function sfx(type){
  if(!state.settings.sound) return;
  initAudio(); if(!audioCtx) return;
  const map={move:[180,.025],confirm:[420,.055],cancel:[240,.05],hit:[110,.07],magic:[620,.10],heal:[760,.12],victory:[880,.14],save:[520,.08],error:[140,.09]};
  const [freq,dur]=map[type]||map.confirm;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type==='hit'?'square':'triangle';o.frequency.value=freq;g.gain.setValueAtTime(.045,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);
}

/* ---------- Input ---------- */
const keys = new Set();
window.addEventListener('keydown', e => {
  const k=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' ','f5','tab'].includes(k)) e.preventDefault();
  if(!keys.has(k)) handleInput(k);
  keys.add(k);
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', ()=>keys.clear());

function bindTouch(id,key,hold=false){
  const el=document.getElementById(id); if(!el)return;
  el.addEventListener('pointerdown',e=>{e.preventDefault();initAudio(); if(hold)keys.add(key); handleInput(key); el.setPointerCapture?.(e.pointerId);});
  const up=e=>{e.preventDefault();if(hold)keys.delete(key);};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('pointerleave',up);
}
bindTouch('up','w',true);bindTouch('down','s',true);bindTouch('left','a',true);bindTouch('right','d',true);bindTouch('btnA','enter');bindTouch('btnB','escape');

function handleInput(k){
  initAudio();
  if(mode==='title') return titleInput(k);
  if(mode==='cutscene') return cutsceneInput(k);
  if(mode==='ending') return endingInput(k);
  if(mode==='battle') return battleInput(k);
  if(mode==='dialogue') return dialogueInput(k);
  if(mode==='shop') return shopInput(k);
  if(mode!=='world') return;

  if(transition.dir) return;
  if(overlay){
    if(k==='escape'||(overlay==='map'&&k==='m')||(overlay==='quests'&&k==='q')||(overlay==='status'&&k==='i')){overlay=null;sfx('cancel');}
    return;
  }
  if(k==='escape'){ pauseSelection=0; mode='pause'; sfx('confirm'); return; }
  if(k==='m'){overlay='map';sfx('confirm');return;}
  if(k==='q'){overlay='quests';sfx('confirm');return;}
  if(k==='i'){overlay='status';sfx('confirm');return;}
  if(k==='f5'){saveGame();return;}
  if(k==='e'||k==='enter'||k===' '){interact();return;}
}

function titleInput(k){
  if(overlay==='controls'){if(k==='escape'||k==='enter'||k===' '){overlay=null;sfx('cancel');}return;}
  const options=getTitleOptions();
  if(k==='arrowup'||k==='w'){titleSelection=(titleSelection+options.length-1)%options.length;sfx('move');}
  else if(k==='arrowdown'||k==='s'){titleSelection=(titleSelection+1)%options.length;sfx('move');}
  else if(k==='enter'||k===' '){const opt=options[titleSelection];if(opt.disabled){sfx('error');return;}sfx('confirm');opt.run();}
}
function getTitleOptions(){
  const has=!!storageGet(SAVE_KEY)||!!storageGet(PREVIOUS_SAVE_KEY)||!!storageGet(LEGACY_KEY);
  return [
    {label:'NEW GAME',sub:'Begin the investigation',run:startNewGame},
    {label:'CONTINUE',sub:has?'Resume your latest save':'No save data',disabled:!has,run:()=>loadGame(true)},
    {label:'CONTROLS',sub:'View controls and systems',run:()=>{overlay='controls';}}
  ];
}

function startNewGame(){
  Object.assign(state,freshState());overlay=null;battle=null;dialogue=null;shop=null;ending=null;worldMobMotion={};particles=[];spriteFx=[];floaters=[];encounterGrace=2;transition={alpha:0,dir:0,callback:null};state.started=true;mode='cutscene';
  cutscene={i:0,pages:[
    {speaker:'NARRATOR',text:'The Civic Relay goes live tonight. Its public archive is supposed to carry every word of the final hearing. Someone has queued a different version.'},
    {speaker:'NARRATOR',text:'Then the relay key disappears inside a ceremonial megaphone. The trail leads from a rally on the Mall to the locked doors of the Capitol.'},
    {speaker:'TRUMP',portrait:'TRUMP',text:'A missing megaphone. In this town. Nobody is going to believe that. Find the cart, get the key, and keep every original.'},
    {speaker:'NARRATOR',text:'Start with the Protester on the Mall. Follow the gold objective marker. Hold Shift to sprint; use the rest points to recover and save. The training post offers an optional practice battle.'}
  ],onDone:()=>{mode='world';setStage(0,true);saveGame(false);}};
  resetTrail();
}
function cutsceneInput(k){if(k==='enter'||k===' '||k==='e'){cutscene.i++;sfx('confirm');if(cutscene.i>=cutscene.pages.length){const cb=cutscene.onDone;cutscene=null;cb?.();}}}

/* ---------- Save / load ---------- */
function saveGame(show=true){
  try{state.playTime+=0;if(!storageSet(SAVE_KEY,JSON.stringify({version:VERSION,state})))throw new Error('storage unavailable');if(show){notify('GAME SAVED');sfx('save');}}
  catch(e){notify('SAVE FAILED');sfx('error');}
}
function loadGame(show=true){
  try{
    let raw=storageGet(SAVE_KEY)||storageGet(PREVIOUS_SAVE_KEY);let data=raw?JSON.parse(raw):null;
    if(!data){const legacy=storageGet(LEGACY_KEY);if(legacy)data=migrateLegacy(JSON.parse(legacy));}
    if(!data?.state) throw new Error('bad save');
    const fresh=freshState();mergeState(fresh,data.state);Object.assign(state,fresh);
    state.started=true;mode='world';overlay=null;dialogue=null;shop=null;battle=null;ending=null;transition={alpha:0,dir:0,callback:null};recoverPlayerPosition();resetTrail();
    if(show)notify('SAVE LOADED');
  }catch(e){notify('SAVE DATA COULD NOT BE LOADED');sfx('error');mode='title';}
}
function mergeState(dst,src){
  for(const k of Object.keys(dst)){
    if(src[k]===undefined)continue;
    if(dst[k]&&typeof dst[k]==='object'&&!Array.isArray(dst[k])&&src[k]&&typeof src[k]==='object'&&!Array.isArray(src[k]))Object.assign(dst[k],src[k]);
    else dst[k]=src[k];
  }
  // Normalize party members without destroying progress.
  dst.party=(src.party||dst.party).map((p,i)=>Object.assign({},freshState().party[i],p,{status:{...(p.status||{})}}));
  dst.mainStage=clamp(Number(dst.mainStage)||0,0,9);
  if(!MAPS[dst.zone])dst.zone='MALL';
  dst.player.x=clamp(dst.player.x,60,MAPS[dst.zone].w-60);dst.player.y=clamp(dst.player.y,90,MAPS[dst.zone].h-60);
}
function migrateLegacy(data){
  const s=freshState(),old=data?.state||{};
  if(old.party)s.party=old.party.map((p,i)=>Object.assign({},s.party[i],{lvl:p.lvl||3,xp:p.xp||0,hp:p.hp||s.party[i].hp,maxHp:p.maxHp||s.party[i].maxHp,mp:p.mp||s.party[i].mp,maxMp:p.maxMp||s.party[i].maxMp,atk:p.atk||s.party[i].atk,def:p.def||s.party[i].def,mag:p.magic||p.mag||s.party[i].mag,limit:p.limit||0,status:{}}));
  s.inventory=Object.assign(s.inventory,old.inventory||{});s.cash=old.cash||s.cash;
  const f=old.flags||{};if(f.megaphoneFound){s.flags.megaphone=true;s.mainStage=3;}if(f.sentinelDefeated){s.flags.sentinel=true;s.mainStage=4;}if(f.ledgerFound){s.flags.ledger=true;s.mainStage=5;}if(f.fixerDefeated){s.flags.fixer=true;s.mainStage=5;}if(f.transcriptFound){s.flags.transcript=true;s.mainStage=6;}if(f.chairDefeated){s.flags.chair=true;s.mainStage=8;}if(f.finaleDone){s.flags.ending=true;s.mainStage=9;}
  s.zone=old.zone==='CAPITOL'?'GROUNDS':old.zone==='ARCHIVE'?'ARCHIVE':old.zone==='PRESS'?'PRESS':'MALL';
  s.player=Object.assign(s.player,old.player||{});return {version:VERSION,state:s};
}

/* ---------- Story ---------- */
function setStage(n,silent=false){
  if(n<=state.mainStage&&!silent)return;state.mainStage=clamp(n,0,9);state.chapter=Math.min(6,Math.floor(state.mainStage/2)+1);
  log(`Main quest: ${MAIN_STAGES[state.mainStage].title}`);
  if(!silent){notify(`QUEST UPDATED — ${MAIN_STAGES[state.mainStage].title.toUpperCase()}`);saveGame(false);}
}
function log(text){state.log.unshift({t:Math.floor(state.playTime),text});state.log=state.log.slice(0,30);}
function notify(text,time=2.5){toast.text=text;toast.time=time;}
function markWitness(id){if(id in state.witnesses&&!state.witnesses[id]){state.witnesses[id]=true;const n=Object.values(state.witnesses).filter(Boolean).length;if(n===5){state.cash+=120;state.inventory.SUPER++;notify('SIDE QUEST: FIVE VOICES COMPLETE  +120 CASH');log('Side quest complete: Five Voices.');}}}

function npcList(){return NPCS[state.zone]||[];}
function startDialogue(n){
  const id=n.id;let lines=[];let onDone=null;
  markWitness(id);
  if(id==='protester'){
    if(state.mainStage===0){lines=['The megaphone vanished when the service cart rolled east.','Do not trust the loudest version of the story. Ask the Veteran and the Teacher; both saw different parts of the route.'];onDone=()=>{setStage(1);checkServiceClues();};}
    else lines=['The rally can wait. Bring back the authentication key and the complete record.'];
  }else if(id==='veteran'){
    lines=['I saw the cart leave by the south service lane.','The megaphone was still on it when it passed the fountain. The driver stopped near the Capitol maintenance yard.'];onDone=()=>{state.flags.veteranClue=true;checkServiceClues();};
  }else if(id==='teacher'){
    lines=['A student photographed the cart tag before it left: maintenance route C-4.','That route ends at the Capitol service yard. The route number and the Veteran\'s sighting should be enough to find it.'];onDone=()=>{state.flags.teacherClue=true;checkServiceClues();};
  }else if(id==='student'){
    lines=['I sent the route photo to the public archive before my battery died.','If the archive copy and the service log disagree, keep both. Differences are evidence too.'];
  }else if(id==='nurse'){
    lines=['Take a breather. I can get everyone back on their feet.','Your HP and MP are restored. Medkits can revive a fallen ally in battle; open Party & Supplies to use items on the road.'];onDone=()=>{state.party.forEach(p=>{p.hp=p.maxHp;p.mp=p.maxMp;p.alive=true;p.status={};});notify('PARTY FULLY RESTORED');};
  }else if(id==='vendor'){openShop();return;}
  else if(id==='gateOfficer'){
    lines=state.flags.megaphone?['The key in that megaphone matches the visitor relay.','The interior checkpoint is still locked by the Sentinel. Use the north doors.']:['Visitor access is open, but the relay key is missing.','Check the maintenance yard before entering.'];
  }else if(id==='scientist'){
    lines=['The bad record is not random corruption. The edits follow a chain.','If you find the Red Ledger, compare its hand-off codes with the broadcast transcript.'];
  }else if(id==='civilian')lines=['The east lawn is quieter. That makes it easier to spot the maintenance cart.'];
  else if(id==='clerk')lines=['The Sentinel locked the archive passage when the relay key disappeared.','Defeat it and the east passage should reopen.'];
  else if(id==='guard2')lines=['The rotunda checkpoint is north. The archive passage is east of the dais.'];
  else if(id==='archivist'){
    lines=state.flags.sentinel?['The Red Ledger is in the secured reading room.','Take the original. The broadcast center will need its chain-of-custody stamps.']:['The archive passage is sealed until the Capitol checkpoint is restored.'];
  }else if(id==='journalist')lines=['A clipped quote can be true and still hide the meaning of the full exchange.','The source transcript at the broadcast center is the only clean comparison copy.'];
  else if(id==='organizer')lines=['People disagree about the conclusion. They should still be able to inspect the same record.'];
  else if(id==='editor'){
    lines=state.flags.fixer?['The Fixer is out of the control room.','The source locker is unlocked now. Take the original transcript to the Fact Checker.']:['Someone in the control room keeps replacing the queued transcript with a cut version.','Stop the Fixer first; then I can unlock the source copy.'];
  }else if(id==='factchecker'){
    if(state.flags.ledger&&state.flags.transcript){lines=['The ledger and transcript match at every verified hand-off except one: the hearing chamber queue.','That is enough to establish the chain. I am signing the verification card now.','Take the complete record to the hearing.'];onDone=()=>{state.flags.factChecked=true;setStage(7);};}
    else lines=['I need both originals: the Red Ledger and the source transcript.','Without both, we can spot a mismatch but cannot prove the chain.'];
  }else if(id==='producer')lines=['The hearing feed is on the upper channel. Once the Fact Checker signs off, the chamber door will open.'];
  else if(id==='marshal')lines=state.flags.factChecked?['Verification card accepted. The hearing is live.','The Committee Chair is at the dais.']:['The chamber is closed until the record is verified.'];
  else if(id==='observer')lines=['Whatever you decide after the hearing, leave the source trail intact.'];
  dialogue={speaker:n.name,portrait:n.portrait,lines,i:0,onDone};mode='dialogue';sfx('confirm');
}
function checkServiceClues(){if(state.flags.veteranClue&&state.flags.teacherClue&&state.mainStage===1)setStage(2);}
function dialogueInput(k){if(k==='escape'){dialogue=null;mode='world';sfx('cancel');return;}if(k==='enter'||k===' '||k==='e'){dialogue.i++;sfx('confirm');if(dialogue.i>=dialogue.lines.length){const cb=dialogue.onDone;dialogue=null;mode='world';cb?.();}}}

function openShop(){shop={selected:0};mode='shop';sfx('confirm');}
function shopInput(k){
  const list=Object.keys(ITEMS);
  if(k==='escape'){shop=null;mode='world';sfx('cancel');return;}
  if(k==='arrowup'||k==='w'){shop.selected=(shop.selected+list.length-1)%list.length;sfx('move');}
  else if(k==='arrowdown'||k==='s'){shop.selected=(shop.selected+1)%list.length;sfx('move');}
  else if(k==='enter'||k===' '){const key=list[shop.selected],it=ITEMS[key];if(state.cash<it.price){notify('NOT ENOUGH CASH');sfx('error');return;}state.cash-=it.price;state.inventory[key]=(state.inventory[key]||0)+1;notify(`BOUGHT ${it.name.toUpperCase()}`);sfx('confirm');}
}

/* ---------- World ---------- */
function resetTrail(){trail=[];lastTrailPoint={x:state.player.x,y:state.player.y,dir:state.player.dir};for(let i=0;i<40;i++)trail.push({...lastTrailPoint});}
function currentMap(){return MAPS[state.zone];}
function worldSolids(zone){
  if(zone==='MALL')return [
    {x:0,y:0,w:2200,h:110},{x:0,y:1320,w:2200,h:100},{x:0,y:0,w:90,h:1420},{x:2110,y:0,w:90,h:1420},
    // Landmark collisions follow the visible bases instead of oversized source rectangles.
    {x:185,y:165,w:395,h:365},{x:1580,y:165,w:400,h:280},{x:935,y:118,w:200,h:510},{x:650,y:455,w:285,h:145},{x:1135,y:455,w:275,h:145},
    {x:1440,y:615,w:145,h:95},{x:320,y:1020,w:180,h:180}
  ];
  if(zone==='GROUNDS')return [
    {x:0,y:0,w:1960,h:90},{x:0,y:1310,w:1960,h:70},{x:0,y:0,w:85,h:1380},{x:1875,y:0,w:85,h:1380},
    {x:720,y:72,w:348,h:545},{x:500,y:930,w:260,h:115},{x:1250,y:860,w:500,h:280},{x:220,y:760,w:165,h:95}
  ];
  if(zone==='ROTUNDA')return [
    {x:0,y:0,w:1620,h:80},{x:0,y:1100,w:1620,h:80},{x:0,y:0,w:80,h:1180},{x:1540,y:0,w:80,h:1180},
    {x:130,y:150,w:250,h:600},{x:1240,y:150,w:250,h:600},{x:520,y:145,w:580,h:150},{x:610,y:470,w:400,h:210}
  ];
  if(zone==='ARCHIVE')return [
    {x:0,y:0,w:1880,h:80},{x:0,y:1240,w:1880,h:80},{x:0,y:0,w:80,h:1320},{x:1800,y:0,w:80,h:1320},
    {x:190,y:170,w:210,h:650},{x:500,y:170,w:210,h:650},{x:810,y:170,w:210,h:650},{x:1120,y:170,w:210,h:420},{x:1430,y:170,w:220,h:650},
    {x:690,y:920,w:510,h:115}
  ];
  if(zone==='PRESS')return [
    {x:0,y:0,w:1760,h:80},{x:0,y:1140,w:1760,h:80},{x:0,y:0,w:80,h:1220},{x:1680,y:0,w:80,h:1220},
    {x:180,y:180,w:300,h:380},{x:600,y:180,w:280,h:380},{x:1050,y:180,w:250,h:300},{x:1400,y:180,w:210,h:420},
    {x:760,y:610,w:160,h:125}
  ];
  return [
    {x:0,y:0,w:1460,h:75},{x:0,y:1010,w:1460,h:70},{x:0,y:0,w:75,h:1080},{x:1385,y:0,w:75,h:1080},
    {x:250,y:130,w:960,h:250},{x:300,y:540,w:250,h:85},{x:910,y:540,w:250,h:85},{x:300,y:720,w:250,h:85},{x:910,y:720,w:250,h:85}
  ];
}
function collides(x,y){const r=18;return worldSolids(state.zone).some(s=>rectContains(s,x,y,r));}
function updateWorld(dt){
  state.playTime+=dt;encounterGrace=Math.max(0,encounterGrace-dt);
  const p=state.player;let dx=0,dy=0;
  if(keys.has('arrowup')||keys.has('w'))dy--;
  if(keys.has('arrowdown')||keys.has('s'))dy++;
  if(keys.has('arrowleft')||keys.has('a'))dx--;
  if(keys.has('arrowright')||keys.has('d'))dx++;
  if(dx||dy){
    const len=Math.hypot(dx,dy);dx/=len;dy/=len;
    const ox=p.x,oy=p.y;
    const nx=p.x+dx*p.speed*dt;if(!collides(nx,p.y))p.x=nx;
    const ny=p.y+dy*p.speed*dt;if(!collides(p.x,ny))p.y=ny;
    p.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
    const moved=Math.hypot(p.x-ox,p.y-oy);p.step+=moved/19;p.frame=Math.floor(p.step)%4;
    if(moved>0)recordTrail();
  } else p.frame=0;
  const m=currentMap();p.x=clamp(p.x,45,m.w-45);p.y=clamp(p.y,95,m.h-45);
  updateMobs(dt);
  updateCamera();
}
function updateMobs(dt){
  for(const mob of WORLD_ENCOUNTERS[state.zone]||[]){
    if(state.defeated[mobKey(state.zone,mob.id)])continue;
    const mm=worldMobMotion[mobKey(state.zone,mob.id)]||(worldMobMotion[mobKey(state.zone,mob.id)]={x:mob.x,y:mob.y,t:Math.random()*9,dir:'down'});
    mm.t+=dt;
    const d=Math.hypot(state.player.x-mm.x,state.player.y-mm.y);
    let vx=0,vy=0;
    if(encounterGrace>0&&d<150&&d>1){vx=-(state.player.x-mm.x)/d;vy=-(state.player.y-mm.y)/d;}
    else if(d<180&&d>45){vx=(state.player.x-mm.x)/d;vy=(state.player.y-mm.y)/d;}
    else {vx=Math.sin(mm.t*.7)*.35;vy=Math.cos(mm.t*.55)*.25;}
    const nx=clamp(mm.x+vx*34*dt,mob.x-70,mob.x+70),ny=clamp(mm.y+vy*34*dt,mob.y-60,mob.y+60);if(!collides(nx,mm.y))mm.x=nx;if(!collides(mm.x,ny))mm.y=ny;mm.dir=Math.abs(vx)>Math.abs(vy)?(vx<0?'left':'right'):(vy<0?'up':'down');
    if(encounterGrace<=0&&Math.hypot(state.player.x-mm.x,state.player.y-mm.y)<46){startBattle([{type:mob.type,level:mob.level},{type:Math.random()<.35?mob.type:pickPartner(mob.type),level:mob.level}],{gold:45+mob.level*7,label:'STREET ENCOUNTER',worldMob:mobKey(state.zone,mob.id)});return;}
  }
}
function pickPartner(type){const opts=['PROTESTER','ACTIVIST','VETERAN','TEACHER','JOURNALIST','UNION','FARMER','STUDENT','SENIOR','NURSE','SCIENTIST','EVERYDAY'].filter(x=>x!==type);return choice(opts);}
function mobKey(z,id){return `${z}:${id}`;}
function updateCamera(){
  const m=currentMap();camera.x=clamp(state.player.x-W/2,0,Math.max(0,m.w-W));camera.y=clamp(state.player.y-WORLD_VIEW_H*.55,0,Math.max(0,m.h-WORLD_VIEW_H));
}
function zoneTransition(zone,spawn=null){
  transition={alpha:0,dir:1,callback:()=>{state.zone=zone;const s=spawn||MAPS[zone].spawn;state.player.x=s.x;state.player.y=s.y;state.player.dir='down';recoverPlayerPosition();resetTrail();encounterGrace=2;worldMobMotion={};updateCamera();notify(MAPS[zone].name);saveGame(false);}};
}
function updateTransition(dt){if(!transition.dir)return;transition.alpha+=transition.dir*dt*3;if(transition.dir>0&&transition.alpha>=1){transition.alpha=1;transition.callback?.();transition.callback=null;transition.dir=-1;}else if(transition.dir<0&&transition.alpha<=0){transition.alpha=0;transition.dir=0;}}

function nearestInteraction(){
  const p=state.player;let best=null,bestD=84;
  for(const n of npcList()){const d=Math.hypot(p.x-n.x,p.y-n.y);if(d<bestD){bestD=d;best={kind:'npc',data:n};}}
  for(const it of interactables()){if(it.hidden?.())continue;const d=Math.hypot(p.x-it.x,p.y-it.y);if(d<bestD){bestD=d;best={kind:'object',data:it};}}
  return best;
}
function interact(){
  const q=nearestInteraction();if(q){if(q.kind==='npc')startDialogue(q.data);else q.data.run();return;}
  notify('NOTHING TO INTERACT WITH HERE',1.2);
}
function interactables(){
  const z=state.zone, arr=[];
  if(z==='MALL'){
    arr.push({id:'toGrounds',x:2070,y:810,label:'Capitol Grounds',run:()=>zoneTransition('GROUNDS',{x:160,y:990})});
    arr.push({id:'usbMall',x:1760,y:1190,label:'Evidence USB',hidden:()=>state.opened.usbMall,icon:'USB',run:()=>collectEvidence('usbMall','USB')});
  }else if(z==='GROUNDS'){
    arr.push({id:'toMall',x:110,y:1030,label:'National Mall',run:()=>zoneTransition('MALL',{x:2020,y:810})});
    arr.push({id:'megaphone',x:610,y:940,label:'Service Cart',hidden:()=>state.flags.megaphone,icon:'MEGA',run:()=>{
      if(state.mainStage<2){notify('YOU NEED BOTH SERVICE-ROUTE CLUES FIRST');sfx('error');return;}state.flags.megaphone=true;state.cash+=75;setStage(3);log('Recovered the relay key inside the megaphone.');notify('MEGAPHONE + RELAY KEY RECOVERED  +75 CASH');sfx('save');
    }});
    arr.push({id:'toRotunda',x:980,y:650,label:'Capitol Doors',run:()=>{if(!state.flags.megaphone){notify('THE RELAY KEY IS STILL MISSING');sfx('error');return;}zoneTransition('ROTUNDA',{x:810,y:1030});}});
    arr.push({id:'usbGrounds',x:1690,y:1210,label:'Evidence USB',hidden:()=>state.opened.usbGrounds,icon:'USB',run:()=>collectEvidence('usbGrounds','USB')});
  }else if(z==='ROTUNDA'){
    arr.push({id:'toGrounds',x:810,y:1060,label:'Capitol Grounds',run:()=>zoneTransition('GROUNDS',{x:980,y:720})});
    arr.push({id:'sentinel',x:810,y:400,label:'Capitol Sentinel',hidden:()=>state.flags.sentinel,run:()=>startBattle([{type:'SENTINEL',level:5}],{gold:430,label:'CAPITOL SENTINEL',boss:'SENTINEL'})});
    arr.push({id:'toArchive',x:1460,y:820,label:'Archive Passage',run:()=>{if(!state.flags.sentinel){notify('THE SENTINEL STILL CONTROLS THIS PASSAGE');sfx('error');return;}zoneTransition('ARCHIVE',{x:170,y:1070});}});
  }else if(z==='ARCHIVE'){
    arr.push({id:'toRotunda',x:110,y:1080,label:'Capitol Interior',run:()=>zoneTransition('ROTUNDA',{x:1450,y:820})});
    arr.push({id:'ledger',x:950,y:860,label:'Red Ledger',hidden:()=>state.flags.ledger,icon:'FILE',run:()=>{if(!state.flags.sentinel){notify('THE VAULT IS STILL SEALED');return;}state.flags.ledger=true;state.evidence.files++;state.cash+=120;setStage(5);notify('RED LEDGER SECURED  +120 CASH');sfx('save');}});
    arr.push({id:'toPress',x:1740,y:1030,label:'Broadcast Center',run:()=>{if(!state.flags.ledger){notify('THE SOURCE CHAIN IS INCOMPLETE — FIND THE LEDGER');sfx('error');return;}zoneTransition('PRESS',{x:160,y:1010});}});
    arr.push({id:'usbArchive',x:1600,y:940,label:'Evidence USB',hidden:()=>state.opened.usbArchive,icon:'USB',run:()=>collectEvidence('usbArchive','USB')});
  }else if(z==='PRESS'){
    arr.push({id:'toArchive',x:105,y:1010,label:'Public Archive',run:()=>zoneTransition('ARCHIVE',{x:1720,y:1030})});
    arr.push({id:'fixer',x:1510,y:650,label:'Media Fixer',hidden:()=>state.flags.fixer,run:()=>startBattle([{type:'FIXER',level:6}],{gold:670,label:'MEDIA FIXER',boss:'FIXER'})});
    arr.push({id:'transcript',x:840,y:690,label:'Source Locker',hidden:()=>state.flags.transcript,icon:'DOC',run:()=>{if(!state.flags.fixer){notify('THE SOURCE LOCKER IS STILL UNDER FIXER CONTROL');sfx('error');return;}state.flags.transcript=true;state.evidence.files++;setStage(6);notify('SOURCE TRANSCRIPT RECOVERED');sfx('save');}});
    arr.push({id:'toHearing',x:1630,y:1000,label:'Hearing Chamber',run:()=>{if(!state.flags.factChecked){notify('FACT CHECKER SIGN-OFF REQUIRED');sfx('error');return;}zoneTransition('HEARING',{x:730,y:950});}});
    arr.push({id:'usbPress',x:1290,y:1030,label:'Evidence USB',hidden:()=>state.opened.usbPress,icon:'USB',run:()=>collectEvidence('usbPress','USB')});
  }else if(z==='HEARING'){
    arr.push({id:'toPress',x:730,y:1000,label:'Broadcast Center',run:()=>zoneTransition('PRESS',{x:1600,y:1000})});
    arr.push({id:'chair',x:730,y:430,label:'Committee Chair',hidden:()=>state.flags.chair,run:()=>startBattle([{type:'CHAIR',level:7}],{gold:1000,label:'FINAL HEARING',boss:'CHAIR'})});
    arr.push({id:'record',x:730,y:430,label:'Public Record',hidden:()=>!state.flags.chair||state.flags.ending,icon:'DOC',run:startEnding});
  }
  return arr;
}
function collectEvidence(id,kind){state.opened[id]=true;state.evidence.usb++;state.inventory.SUPER++;state.cash+=40;notify(`EVIDENCE USB ${state.evidence.usb}/4  +SUPER POTION`);log(`Recovered evidence USB ${state.evidence.usb}/4.`);if(state.evidence.usb===4){state.cash+=220;state.inventory.MEDKIT+=2;notify('SIDE QUEST COMPLETE: CLEAN BACKUPS  +220 CASH');}}

/* ---------- Pause ---------- */
function pauseInput(k){
  const opts=pauseOptions();
  if(k==='escape'){mode='world';sfx('cancel');return;}
  if(k==='arrowup'||k==='w'){pauseSelection=(pauseSelection+opts.length-1)%opts.length;sfx('move');}
  else if(k==='arrowdown'||k==='s'){pauseSelection=(pauseSelection+1)%opts.length;sfx('move');}
  else if(k==='enter'||k===' '){opts[pauseSelection].run();sfx('confirm');}
}
function pauseOptions(){return [
  {label:'Resume',run:()=>mode='world'},
  {label:'Save Game',run:()=>saveGame()},
  {label:'Load Game',run:()=>loadGame()},
  {label:'Party & Inventory',run:()=>{mode='world';overlay='status';}},
  {label:`Sound: ${state.settings.sound?'ON':'OFF'}`,run:()=>{state.settings.sound=!state.settings.sound;if(!state.settings.sound&&audioCtx)audioCtx.suspend?.();else audioCtx?.resume?.();}},
  {label:`Screen Shake: ${state.settings.shake?'ON':'OFF'}`,run:()=>state.settings.shake=!state.settings.shake},
  {label:'Return to Title',run:()=>{saveGame(false);mode='title';titleSelection=0;}}
];}

/* ---------- Battle ---------- */
function makeEnemy(spec){const d=ENEMY_DEFS[spec.type],scale=1+(spec.level-3)*.15;return {type:spec.type,name:d.label,sprite:d.sprite,level:spec.level,maxHp:Math.round(d.hp*scale),hp:Math.round(d.hp*scale),atk:Math.round(d.atk*scale),def:Math.round(d.def*scale),mag:Math.round(d.mag*scale),ai:d.ai,trait:d.trait,quote:d.quote,boss:!!d.boss,status:{},guard:false,analyzed:false};}
function startBattle(specs,reward={}){
  if(mode==='battle')return;
  const clean=specs.filter(Boolean).slice(0,3);battle={enemies:clean.map(makeEnemy),reward,round:1,actorIndex:0,phase:'intro',menuIndex:0,subIndex:0,targetIndex:0,pending:null,action:null,enemyQueue:[],enemyIndex:0,message:`${reward.label||'ENCOUNTER'} — ${clean.map(s=>ENEMY_DEFS[s.type].label).join(' + ')}`,timer:.55,log:[]};
  state.party.forEach(p=>{p.alive=p.hp>0;p.guard=false;p.status={};});battle.actorIndex=Math.max(0,state.party.findIndex(p=>p.alive));mode='battle';particles=[];spriteFx=[];floaters=[];screenShake=0;sfx('confirm');
}
function aliveParty(){return state.party.filter(p=>p.alive&&p.hp>0);}
function aliveEnemies(){return battle.enemies.filter(e=>e.hp>0);}
function currentActor(){return state.party[battle.actorIndex];}
function effective(u,stat){let v=u[stat];const st=u.status||{};if(stat==='atk'){if(st.atkUp)v*=1.25;if(st.atkDown)v*=.76;}if(stat==='def'){if(st.defUp)v*=1.30;if(st.defDown)v*=.76;}if(stat==='mag'){if(st.magUp)v*=1.25;if(st.magDown)v*=.76;}return v;}
function damagePhysical(a,t,power=1,critBonus=0){let base=effective(a,'atk')*power-effective(t,'def')*.52+randInt(-6,8);let crit=Math.random()<((a.luck||8)/250+critBonus);if(t.status?.vulnerable)base*=1.22;if(t.guard)base*=.50;if(crit)base*=1.55;return {amount:Math.max(1,Math.round(base)),crit};}
function damageMagic(a,t,power=1){let base=effective(a,'mag')*power-effective(t,'def')*.26+randInt(-5,7);if(t.trait?.includes('Tech')&&a.name==='RFK')base*=1.2;if(t.status?.vulnerable)base*=1.22;if(t.guard)base*=.62;return {amount:Math.max(1,Math.round(base)),crit:false};}
function damageHybrid(a,t,power=1){let base=(effective(a,'atk')*.45+effective(a,'mag')*.72)*power-effective(t,'def')*.34+randInt(-6,8);if(t.status?.vulnerable)base*=1.2;if(t.guard)base*=.58;let crit=Math.random()<((a.luck||8)/300);if(crit)base*=1.5;return {amount:Math.max(1,Math.round(base)),crit};}
function applyDamage(t,res){t.hp=Math.max(0,t.hp-res.amount);if('alive'in t){t.alive=t.hp>0;t.limit=Math.min(100,t.limit+10);}t.hitTimer=.28;addFloater(t,res.crit?`CRIT ${res.amount}`:`${res.amount}`,res.crit?'#ffe970':'#ffffff');screenShake=state.settings.shake?(res.crit?7:4):0;sfx('hit');}
function addStatus(u,key,turns){u.status[key]=Math.max(u.status[key]||0,turns);}
function removeDebuffs(u){for(const k of ['atkDown','defDown','magDown','vulnerable'])delete u.status[k];}
function tickStatuses(units){for(const u of units){if(u.hp<=0)continue;if(u.status.regen){const amt=Math.max(8,Math.round(u.maxHp*.06));u.hp=Math.min(u.maxHp,u.hp+amt);addFloater(u,`+${amt}`,'#7dff9f');}if(u.status.mpRegen&&u.maxMp){const amt=Math.max(6,Math.round(u.maxMp*.06));u.mp=Math.min(u.maxMp,u.mp+amt);addFloater(u,`+${amt} MP`,'#76ddff');}for(const k of Object.keys(u.status)){u.status[k]--;if(u.status[k]<=0)delete u.status[k];}}}

function battleInput(k){
  if(!battle)return;
  if(battle.phase==='intro'||battle.phase==='action'||battle.phase==='enemyAction'||battle.phase==='victory'||battle.phase==='defeat')return;
  if(battle.phase==='message'){if(k==='enter'||k===' '){battle.phase='input';sfx('confirm');}return;}
  if(k==='escape'){
    if(['skills','items','target','analyze'].includes(battle.phase)){battle.phase='input';battle.pending=null;sfx('cancel');return;}return;
  }
  if(battle.phase==='input'){
    if(k==='arrowleft'||k==='a'){battle.menuIndex=(battle.menuIndex+5)%6;sfx('move');}
    else if(k==='arrowright'||k==='d'){battle.menuIndex=(battle.menuIndex+1)%6;sfx('move');}
    else if(k==='arrowup'||k==='w'){battle.menuIndex=(battle.menuIndex+4)%6;sfx('move');}
    else if(k==='arrowdown'||k==='s'){battle.menuIndex=(battle.menuIndex+2)%6;sfx('move');}
    else if(k>='1'&&k<='6'){battle.menuIndex=Number(k)-1;commitBattleMenu();}
    else if(k==='enter'||k===' ')commitBattleMenu();
    return;
  }
  if(battle.phase==='skills'){
    const skills=skillsFor(currentActor());if(k==='arrowup'||k==='w'||k==='arrowleft'||k==='a'){battle.subIndex=(battle.subIndex+skills.length-1)%skills.length;sfx('move');}
    else if(k==='arrowdown'||k==='s'||k==='arrowright'||k==='d'){battle.subIndex=(battle.subIndex+1)%skills.length;sfx('move');}
    else if(k==='enter'||k===' ')chooseSkill(skills[battle.subIndex]);return;
  }
  if(battle.phase==='items'){
    const items=battleItems();if(!items.length){battle.phase='input';return;}if(k==='arrowup'||k==='w'){battle.subIndex=(battle.subIndex+items.length-1)%items.length;sfx('move');}else if(k==='arrowdown'||k==='s'){battle.subIndex=(battle.subIndex+1)%items.length;sfx('move');}else if(k==='enter'||k===' ')chooseItem(items[battle.subIndex][0]);return;
  }
  if(battle.phase==='target'){
    const ts=battleTargets();if(!ts.length)return;if(k==='arrowleft'||k==='a'||k==='arrowup'||k==='w'){battle.targetIndex=(battle.targetIndex+ts.length-1)%ts.length;sfx('move');}else if(k==='arrowright'||k==='d'||k==='arrowdown'||k==='s'){battle.targetIndex=(battle.targetIndex+1)%ts.length;sfx('move');}else if(k==='enter'||k===' ')confirmBattleTarget(ts[battle.targetIndex]);return;
  }
  if(battle.phase==='analyze'){
    const es=aliveEnemies();if(k==='arrowleft'||k==='a'||k==='arrowup'||k==='w'){battle.targetIndex=(battle.targetIndex+es.length-1)%es.length;sfx('move');}else if(k==='arrowright'||k==='d'||k==='arrowdown'||k==='s'){battle.targetIndex=(battle.targetIndex+1)%es.length;sfx('move');}else if(k==='enter'||k===' '){const e=es[battle.targetIndex];e.analyzed=true;addStatus(e,'vulnerable',2);battle.message=`ANALYZED ${e.name}: ${e.trait}. Vulnerable for 2 rounds.`;battle.phase='message';sfx('magic');battle.pending={advanceAfterMessage:true};}return;
  }
}
function battleItems(){return Object.entries(state.inventory).filter(([k,v])=>v>0&&ITEMS[k]);}
function skillsFor(p){const list=PARTY_DEFS[p.name].skills.map(s=>({...s,limit:false}));if(p.limit>=100)list.push({...PARTY_DEFS[p.name].limit,cost:0,limit:true});return list;}
function commitBattleMenu(){
  const p=currentActor();if(!p||!p.alive){advancePlayer();return;}sfx('confirm');
  if(battle.menuIndex===0){battle.pending={kind:'basic',targetType:'enemy',pose:BASIC_POSE[p.name]??0};battle.targetIndex=0;battle.phase='target';}
  else if(battle.menuIndex===1){battle.subIndex=0;battle.phase='skills';}
  else if(battle.menuIndex===2){if(!battleItems().length){battle.message='NO ITEMS AVAILABLE.';battle.phase='message';battle.pending=null;sfx('error');}else{battle.subIndex=0;battle.phase='items';}}
  else if(battle.menuIndex===3){beginPlayerAction({kind:'guard',actor:p,pose:1});}
  else if(battle.menuIndex===4){battle.targetIndex=0;battle.phase='analyze';}
  else if(battle.menuIndex===5){if(battle.reward.boss){battle.message='YOU CANNOT RUN FROM A BOSS ENCOUNTER.';battle.phase='message';sfx('error');}else if(Math.random()<.72){battle.message='THE PARTY DISENGAGED.';battle.phase='victory';setTimeout(()=>finishBattle(false,true),550);}else{battle.message='COULD NOT ESCAPE.';battle.phase='message';battle.pending={failedRun:true};}}
}
function chooseSkill(skill){
  const p=currentActor();if(!skill.limit&&p.mp<skill.cost){battle.message='NOT ENOUGH MP.';battle.phase='message';battle.pending=null;sfx('error');return;}
  battle.pending={kind:'skill',skill,targetType:skill.target==='enemy'?'enemy':skill.target==='ally'?'ally':null};
  if(skill.target==='enemy'||skill.target==='ally'){battle.targetIndex=0;battle.phase='target';}
  else beginPlayerAction({kind:'skill',actor:p,skill,targets:skill.target==='enemies'?aliveEnemies():skill.target==='allies'?aliveParty():[p],pose:skill.pose});
}
function chooseItem(key){const item=ITEMS[key];battle.pending={kind:'item',item:key,targetType:'ally'};battle.targetIndex=0;battle.phase='target';}
function confirmBattleTarget(target){
  const p=currentActor(),pd=battle.pending;if(!pd)return;
  if(pd.kind==='basic')beginPlayerAction({kind:'basic',actor:p,target,pose:pd.pose??BASIC_POSE[p.name]??0});
  else if(pd.kind==='skill')beginPlayerAction({kind:'skill',actor:p,skill:pd.skill,targets:[target],pose:pd.skill.pose});
  else if(pd.kind==='item')beginPlayerAction({kind:'item',actor:p,target,item:pd.item,pose:BATTLE_IDLE_POSE[p.name]??0});
}
function beginPlayerAction(a){
  if(a.skill){if(a.skill.limit)a.actor.limit=0;else a.actor.mp-=a.skill.cost;}
  battle.message=a.kind==='basic'?`${a.actor.label}: ${BASIC_NAMES[a.actor.name]}`:a.kind==='skill'?`${a.actor.label}: ${a.skill.name}`:a.kind==='guard'?`${a.actor.label}: Defend`:`${a.actor.label}: ${ITEMS[a.item].name}`;battle.action={...a,t:0,applied:false,duration:.82};battle.phase='action';battle.pending=null;sfx('confirm');
}
function resolvePlayerAction(a){
  const p=a.actor;
  if(a.kind==='guard'){p.guard=true;addStatus(p,'defUp',2);battle.message=`${p.label} braces for impact.`;addFx('buff',partyPos(p).x,partyPos(p).y-70);return endPlayerAction();}
  if(a.kind==='item'){
    if(!state.inventory[a.item]){battle.message='THE ITEM IS NO LONGER AVAILABLE.';return endPlayerAction();}
    state.inventory[a.item]--;const it=ITEMS[a.item],t=a.target;if(it.heal){const before=t.hp;t.hp=Math.min(t.maxHp,t.hp+it.heal);t.alive=t.hp>0;addFloater(t,`+${t.hp-before}`,'#7dff9f');}else if(it.mp){const before=t.mp;t.mp=Math.min(t.maxMp,t.mp+it.mp);addFloater(t,`+${t.mp-before} MP`,'#76ddff');}p.limit=Math.min(100,p.limit+8);battle.message=`${p.label} used ${it.name} on ${t.label}.`;addFx('heal',partyPos(t).x,partyPos(t).y-65);sfx('heal');return endPlayerAction();
  }
  if(a.kind==='basic'){
    const res=p.name==='RFK'?damageMagic(p,a.target,1):p.name==='LUTNICK'?damageHybrid(p,a.target,1):damagePhysical(p,a.target,1,0);applyDamage(a.target,res);p.limit=Math.min(100,p.limit+20);battle.message=`${p.label} attacks ${a.target.name}${res.crit?' — CRITICAL':''}.`;addFx(p.name==='HEGSETH'?'gun':p.name==='LUTNICK'?'money':p.name==='RFK'?'magic':'hit',enemyPos(a.target).x,enemyPos(a.target).y-70);return endPlayerAction();
  }
  const s=a.skill,targets=a.targets||[];let msg=`${p.label} used ${s.name}.`;
  if(s.kind==='physical'||s.kind==='magic'||s.kind==='hybrid'){
    const t=targets[0];const res=s.kind==='physical'?damagePhysical(p,t,s.power,s.crit||0):s.kind==='magic'?damageMagic(p,t,s.power):damageHybrid(p,t,s.power);applyDamage(t,res);addFx(s.kind==='physical'?(p.name==='HEGSETH'?'gun':p.name==='LUTNICK'?'money':'hit'):p.name==='LUTNICK'?'money':'magic',enemyPos(t).x,enemyPos(t).y-70);p.limit=Math.min(100,p.limit+18);
  }else if(['physicalAll','magicAll','hybridAll'].includes(s.kind)){
    for(const t of targets){const res=s.kind==='physicalAll'?damagePhysical(p,t,s.power,s.crit||0):s.kind==='magicAll'?damageMagic(p,t,s.power):damageHybrid(p,t,s.power);applyDamage(t,res);if(s.name==='Money Rain'&&Math.random()<.45)addStatus(t,'defDown',3);}addFx(p.name==='LUTNICK'?'money':s.kind==='physicalAll'?'hit':'magic',900,315);p.limit=Math.min(100,p.limit+20);
  }else if(s.kind==='buffAtk'){for(const t of targets)addStatus(t,'atkUp',3);addFx('buff',420,365);}
  else if(s.kind==='buffDef'){addStatus(p,'defUp',3);p.guard=true;addFx('buff',partyPos(p).x,partyPos(p).y-70);}
  else if(s.kind==='buffMag'){for(const t of targets){addStatus(t,'magUp',3);addStatus(t,'mpRegen',3);t.mp=Math.min(t.maxMp,t.mp+18);}addFx('buff',420,365);}
  else if(s.kind==='heal'||s.kind==='healRegen'){
    const t=targets[0],amt=Math.round(62+effective(p,'mag')*s.power),before=t.hp;t.hp=Math.min(t.maxHp,t.hp+amt);t.alive=true;if(s.kind==='healRegen')addStatus(t,'regen',3);if(s.name==='Golden Gut')delete t.status.atkDown;addFloater(t,`+${t.hp-before}`,'#7dff9f');addFx('heal',partyPos(t).x,partyPos(t).y-70);sfx('heal');
  }else if(s.kind==='healAll'||s.kind==='healAllCleanse'){
    const amt=Math.round(36+effective(p,'mag')*s.power);for(const t of targets){const before=t.hp;t.hp=Math.min(t.maxHp,t.hp+amt);t.alive=t.hp>0;if(s.kind==='healAllCleanse')removeDebuffs(t);addFloater(t,`+${t.hp-before}`,'#7dff9f');}addFx('heal',420,365);sfx('heal');
  }
  battle.message=msg;return endPlayerAction();
}
function endPlayerAction(){
  if(!battle?.action)return;
  battle.action.willWin=aliveEnemies().length===0;
  battle.action.resolved=true;
}
function advancePlayer(){
  battle.pending=null;let i=battle.actorIndex+1;while(i<state.party.length&&!state.party[i].alive)i++;
  if(i<state.party.length){battle.actorIndex=i;battle.menuIndex=0;battle.phase='input';return;}
  startEnemyPhase();
}
function startEnemyPhase(){battle.enemies.forEach(e=>{e.guard=false;});battle.enemyQueue=aliveEnemies().slice();battle.enemyIndex=0;battle.phase='enemyAction';startEnemyAction();}
function startEnemyAction(){
  if(battle.enemyIndex>=battle.enemyQueue.length){tickStatuses(state.party);tickStatuses(battle.enemies);state.party.forEach(p=>{p.guard=false;});battle.round++;battle.actorIndex=0;while(battle.actorIndex<state.party.length&&!state.party[battle.actorIndex].alive)battle.actorIndex++;if(battle.actorIndex>=state.party.length)return loseBattle();battle.phase='input';battle.menuIndex=0;return;}
  const e=battle.enemyQueue[battle.enemyIndex];if(e.hp<=0){battle.enemyIndex++;return startEnemyAction();}battle.action={kind:'enemy',actor:e,t:0,applied:false,duration:.72};battle.phase='enemyAction';
}
function resolveEnemyAction(e){
  const living=aliveParty();if(!living.length)return loseBattle();
  let move={name:'Strike',kind:'physical',power:1};
  const hp=e.hp/e.maxHp,r=Math.random();
  switch(e.ai){
    case'protester':move=r<.28?{name:'Chant',kind:'debuffAtk'}:{name:'Shove',kind:'physical',power:1};break;
    case'activist':move=r<.3?{name:'Disrupt',kind:'debuffMag'}:{name:'Megaphone Burst',kind:'magic',power:.95};break;
    case'veteran':move=r<.25?{name:'Take Cover',kind:'guard'}:{name:'Rifle Shot',kind:'physical',power:1.15};break;
    case'teacher':move=r<.30?{name:'Correction',kind:'debuffDef'}:{name:'Citation',kind:'magic',power:1.05};break;
    case'journalist':move=r<.28?{name:'Flash',kind:'vulnerable'}:{name:'Breaking Story',kind:'magic',power:1.05};break;
    case'union':move=r<.3?{name:'Solidarity',kind:'guardAll'}:{name:'Hammer Down',kind:'physical',power:1.12};break;
    case'farmer':move={name:'Pitchfork',kind:'physical',power:1.15};break;
    case'student':move=r<.25?{name:'Counterpoint',kind:'debuffAtk'}:{name:'Debate',kind:'magic',power:.95};break;
    case'senior':move=r<.25?{name:'Second Wind',kind:'regen'}:{name:'Cane Tap',kind:'physical',power:.95};break;
    case'nurse':move=hp<.55&&r<.65?{name:'Triage',kind:'healEnemy'}:{name:'Pressure Point',kind:'magic',power:.9};break;
    case'scientist':move=r<.30?{name:'Scan',kind:'vulnerable'}:{name:'Experiment',kind:'magic',power:1.15};break;
    case'everyday':move=r<.20?{name:'Dig In',kind:'guard'}:{name:'Straight Talk',kind:'physical',power:1.05};break;
    case'sentinel':move=hp<.45&&r<.32?{name:'Lockdown',kind:'guardAll'}:r<.28?{name:'Checkpoint Sweep',kind:'allPhysical',power:.78}:{name:'Access Denied',kind:'physical',power:1.25};break;
    case'fixer':move=r<.27?{name:'Packet Drop',kind:'mpDrain'}:r<.50?{name:'Spin Cycle',kind:'debuffMagAll'}:{name:'Cut Feed',kind:'magic',power:1.28};break;
    case'chair':move=r<.24?{name:'Filibuster',kind:'debuffAtkAll'}:r<.47?{name:'Gavel Storm',kind:'allMagic',power:.88}:r<.62?{name:'Objection',kind:'mpDrain'}:{name:'Order!',kind:'magic',power:1.38};break;
  }
  const target=choice(living);battle.message=`${e.name}: ${move.name}!`;
  if(move.kind==='physical'||move.kind==='magic'){
    const res=move.kind==='physical'?damagePhysical(e,target,move.power):damageMagic(e,target,move.power);applyDamage(target,res);addFx(move.kind==='physical'?'hit':'magic',partyPos(target).x,partyPos(target).y-65);
  }else if(move.kind==='allPhysical'||move.kind==='allMagic'){
    for(const t of living){const res=move.kind==='allPhysical'?damagePhysical(e,t,move.power):damageMagic(e,t,move.power);applyDamage(t,res);}addFx(move.kind==='allPhysical'?'hit':'magic',420,350);
  }else if(move.kind==='debuffAtk'){addStatus(target,'atkDown',3);addFx('debuff',partyPos(target).x,partyPos(target).y-65);}
  else if(move.kind==='debuffDef'){addStatus(target,'defDown',3);addFx('debuff',partyPos(target).x,partyPos(target).y-65);}
  else if(move.kind==='debuffMag'){addStatus(target,'magDown',3);addFx('debuff',partyPos(target).x,partyPos(target).y-65);}
  else if(move.kind==='vulnerable'){addStatus(target,'vulnerable',2);addFx('debuff',partyPos(target).x,partyPos(target).y-65);}
  else if(move.kind==='debuffMagAll'){living.forEach(t=>addStatus(t,'magDown',3));addFx('debuff',420,350);}
  else if(move.kind==='debuffAtkAll'){living.forEach(t=>addStatus(t,'atkDown',3));addFx('debuff',420,350);}
  else if(move.kind==='guard'){e.guard=true;addStatus(e,'defUp',2);addFx('buff',enemyPos(e).x,enemyPos(e).y-75);}
  else if(move.kind==='guardAll'){aliveEnemies().forEach(t=>{t.guard=true;addStatus(t,'defUp',2);});addFx('buff',930,345);}
  else if(move.kind==='regen'){addStatus(e,'regen',3);addFx('heal',enemyPos(e).x,enemyPos(e).y-75);}
  else if(move.kind==='healEnemy'){const t=aliveEnemies().sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0],amt=Math.round(e.mag*2.2+45);t.hp=Math.min(t.maxHp,t.hp+amt);addFloater(t,`+${amt}`,'#7dff9f');addFx('heal',enemyPos(t).x,enemyPos(t).y-75);sfx('heal');}
  else if(move.kind==='mpDrain'){for(const t of living){const amt=Math.min(t.mp,14+e.level*2);t.mp-=amt;addFloater(t,`-${amt} MP`,'#c98cff');}addFx('debuff',420,350);}
  if(aliveParty().length===0)return loseBattle();
}
function winBattle(){
  if(battle.phase==='victory')return;const boss=!!battle.reward.boss,xp=boss?270:82,gold=battle.reward.gold||50;
  state.cash+=gold;state.party.forEach(p=>{if(p.alive){p.xp+=xp;p.limit=Math.min(100,p.limit+28);levelCheck(p);}});
  if(battle.reward.worldMob)state.defeated[battle.reward.worldMob]=true;
  if(battle.reward.boss==='SENTINEL'){state.flags.sentinel=true;setStage(4);}
  if(battle.reward.boss==='FIXER'){state.flags.fixer=true;notify('FIXER DEFEATED — SOURCE LOCKER UNLOCKED');}
  if(battle.reward.boss==='CHAIR'){state.flags.chair=true;setStage(8);notify('HEARING WON — THE PUBLIC RECORD IS READY');}
  battle.message=`VICTORY!  +${gold} CASH  +${xp} XP`;battle.phase='victory';sfx('victory');setTimeout(()=>finishBattle(true,false),950);
}
function loseBattle(){if(!battle||battle.phase==='defeat')return;battle.message='DEFEAT — THE PARTY FALLS BACK TO THE MALL MEDICAL TENT.';battle.phase='defeat';setTimeout(()=>{state.party.forEach(p=>{p.hp=Math.max(1,Math.round(p.maxHp*.65));p.mp=Math.max(1,Math.round(p.maxMp*.6));p.alive=true;p.status={};});state.zone='MALL';state.player.x=530;state.player.y=1170;resetTrail();battle=null;mode='world';encounterGrace=1.5;notify('RECOVERED AT THE MALL');saveGame(false);},1200);}
function startStoryScene(pages,onDoneText=''){
  mode='cutscene';cutscene={i:0,pages,onDone:()=>{mode='world';if(onDoneText)notify(onDoneText);saveGame(false);}};
}
function finishBattle(won,escaped){
  if(!battle)return;const reward=battle.reward||{};
  if(won){state.party.forEach(p=>{p.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*.12));p.mp=Math.min(p.maxMp,p.mp+Math.round(p.maxMp*.10));p.alive=p.hp>0;p.status={};});}
  battle=null;updateCamera();
  if(won&&reward.boss&&BOSS_SCENES[reward.boss]){encounterGrace=2;saveGame(false);startStoryScene(BOSS_SCENES[reward.boss]);return;}
  mode='world';state.party.forEach(p=>{p.status={};p.guard=false;});if(escaped)encounterGrace=3;else encounterGrace=1.2;saveGame(false);if(escaped)notify('ESCAPED SAFELY');
}
function levelCheck(p){while(p.xp>=p.lvl*115){p.xp-=p.lvl*115;p.lvl++;p.maxHp+=22;p.maxMp+=8;p.atk+=4;p.def+=3;p.mag+=4;p.luck+=1;p.hp=p.maxHp;p.mp=p.maxMp;notify(`${p.label} REACHED LEVEL ${p.lvl}`);log(`${p.label} reached level ${p.lvl}.`);}}
function addFx(kind,x,y){
  const mapped=kind==='magic'?'debuff':kind;
  if(A.effects[mapped])spriteFx.push({kind:mapped,x,y,t:0,duration:kind==='gun'?.42:kind==='hit'?.48:.62});
  for(let i=0;i<(kind==='magic'?22:14);i++)particles.push({x,y,vx:randInt(-90,90),vy:randInt(-110,30),life:.45+Math.random()*.35,kind,size:randInt(3,8)});
}
function addFloater(t,text,color){const pos=('name'in t&&state.party.includes(t))?partyPos(t):enemyPos(t);floaters.push({x:pos.x,y:pos.y-92,text,color,life:.9});}
function partyPos(p){
  const i=state.party.indexOf(p),formation=[{x:185,y:402},{x:115,y:486},{x:330,y:486},{x:535,y:478}];return formation[i]||{x:120+i*155,y:478};
}
function enemyPos(e){
  const i=battle.enemies.indexOf(e),n=battle.enemies.length;
  const forms=n===1?[{x:1025,y:468}]:n===2?[{x:900,y:438},{x:1095,y:482}]:[{x:825,y:430},{x:1000,y:482},{x:1160,y:438}];
  return forms[i]||{x:1010,y:455};
}

/* ---------- Ending ---------- */
function startEnding(){if(!state.flags.chair)return;mode='ending';ending={step:'choice',choice:0,page:0};sfx('confirm');}
function endingInput(k){
  if(ending.step==='choice'){
    if(k==='arrowleft'||k==='a'||k==='arrowup'||k==='w'){ending.choice=0;sfx('move');}
    if(k==='arrowright'||k==='d'||k==='arrowdown'||k==='s'){ending.choice=1;sfx('move');}
    if(k==='1')ending.choice=0;if(k==='2')ending.choice=1;
    if(k==='enter'||k===' '){state.endingChoice=ending.choice;ending.step='epilogue';ending.page=0;state.flags.ending=true;setStage(9);saveGame(false);sfx('victory');}
  } else if(k==='enter'||k===' '||k==='e'){
    ending.page++;if(ending.page>=endingPages().length){mode='world';ending=null;notify('POSTGAME UNLOCKED');saveGame(false);}sfx('confirm');
  }
}
function endingPages(){
  if(state.endingChoice===0)return [
    'The complete source package goes live with the ledger, transcript, verification card, and every correction attached.',
    'The first hour is chaotic. People argue about the meaning, but they are finally arguing from the same record.',
    'The Civic Relay stays online as an open archive. The team leaves the chamber with one rule intact: source first, conclusion second.'
  ];
  return [
    'The complete source package is entered into the public hearing record before the broadcast begins.',
    'The delay frustrates the crowd, but the chain of custody survives every challenge placed on it.',
    'When the broadcast finally opens, it carries the hearing record beside the source. The team leaves with one rule intact: preserve the trail.'
  ];
}

/* ---------- Update ---------- */
function update(dt){
  totalTime+=dt;if(toast.time>0)toast.time-=dt;updateTransition(dt);
  if(mode==='pause'){/* frozen */}
  else if(mode==='world'&&!overlay&&!transition.dir)updateWorld(dt);
  else if(mode==='battle')updateBattle(dt);
  updateEffects(dt);
}
function updateBattle(dt){
  if(!battle)return;
  if(battle.phase==='intro'){battle.timer-=dt;if(battle.timer<=0){battle.phase='input';battle.actorIndex=Math.max(0,state.party.findIndex(p=>p.alive));}}
  if(battle.phase==='action'&&battle.action){
    battle.action.t+=dt;
    if(battle.action.t>.36&&!battle.action.applied){battle.action.applied=true;resolvePlayerAction(battle.action);}
    if(battle?.phase==='action'&&battle.action&&battle.action.t>=battle.action.duration&&battle.action.resolved){
      const won=battle.action.willWin;battle.action=null;if(won)winBattle();else{battle.phase='message';battle.pending={advanceAfterMessage:true};}
    }
  }
  else if(battle.phase==='enemyAction'&&battle.action){battle.action.t+=dt;if(battle.action.t>.31&&!battle.action.applied){battle.action.applied=true;resolveEnemyAction(battle.action.actor);}if(battle.action&&battle.action.t>=battle.action.duration){battle.enemyIndex++;battle.action=null;if(battle?.phase==='enemyAction')startEnemyAction();}}
  else if(battle.phase==='message'&&battle.pending?.advanceAfterMessage){/* waits for user */}
}
function updateEffects(dt){
  for(const u of [...state.party,...(battle?.enemies||[])])u.hitTimer=Math.max(0,(u.hitTimer||0)-dt);
  for(const fx of spriteFx)fx.t+=dt;spriteFx=spriteFx.filter(fx=>fx.t<fx.duration);
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=55*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
  for(const f of floaters){f.y-=42*dt;f.life-=dt;}floaters=floaters.filter(f=>f.life>0);
  screenShake=Math.max(0,screenShake-dt*18);
}

// Intercept pause after function declaration so global handler stays simple.
const _baseHandleInput=handleInput;
handleInput=function(k){if(mode==='pause')return pauseInput(k);_baseHandleInput(k);};

// Advance after action messages, including failed run and analyze.
const _battleInput=battleInput;
battleInput=function(k){
  if(battle?.phase==='message'&&(k==='enter'||k===' ')){
    const pd=battle.pending;battle.pending=null;sfx('confirm');if(pd?.advanceAfterMessage||pd?.failedRun){advancePlayer();return;}battle.phase='input';return;
  }
  _battleInput(k);
};

/* ---------- Drawing primitives ---------- */
function text(s,x,y,size=18,color='#fff',align='left',weight=700){ctx.fillStyle=color;ctx.font=`${weight} ${size}px "QuestMono", monospace`;ctx.textAlign=align;ctx.textBaseline='top';ctx.fillText(String(s),Math.round(x),Math.round(y));}
function small(s,x,y,size=12,color='#d8e0ff',align='left'){text(s,x,y,size,color,align,700);}
function panel(x,y,w,h,fill='rgba(6,18,73,.96)',border='#eef1ff',line=3){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);ctx.strokeStyle=border;ctx.lineWidth=line;ctx.strokeRect(x+1.5,y+1.5,w-3,h-3);ctx.strokeStyle='rgba(109,136,210,.75)';ctx.lineWidth=1;ctx.strokeRect(x+7.5,y+7.5,w-15,h-15);}
function bar(x,y,w,h,val,max,color='#ffe970'){ctx.fillStyle='#141e50';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#dce5ff';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.fillStyle=color;ctx.fillRect(x+2,y+2,Math.round((w-4)*clamp(max?val/max:0,0,1)),h-4);}
function wrap(s,x,y,maxW,lineH,size=17,color='#fff',maxLines=99){ctx.font=`700 ${size}px "QuestMono", monospace`;ctx.textAlign='left';ctx.textBaseline='top';const words=String(s).split(' ');let line='',yy=y,lines=0;for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxW&&line){ctx.fillStyle=color;ctx.fillText(line,x,yy);yy+=lineH;lines++;if(lines>=maxLines)return yy;line=word;}else line=test;}if(line&&lines<maxLines){ctx.fillStyle=color;ctx.fillText(line,x,yy);yy+=lineH;}return yy;}
function drawRectSprite(r,x,footY,scale=1,flip=false,alpha=1){if(!atlasReady||!r)return;const dw=Math.round(r[2]*scale),dh=Math.round(r[3]*scale);ctx.save();ctx.globalAlpha=alpha;ctx.translate(Math.round(x),Math.round(footY));if(flip)ctx.scale(-1,1);ctx.drawImage(atlas,r[0],r[1],r[2],r[3],-Math.round(dw/2),-dh,dw,dh);ctx.restore();}
function drawAnchoredRectSprite(r,x,footY,scale=1,anchorX=null,flip=false,alpha=1){if(!atlasReady||!r)return;const dw=Math.round(r[2]*scale),dh=Math.round(r[3]*scale),ax=Math.round((anchorX??r[2]/2)*scale);ctx.save();ctx.globalAlpha=alpha;ctx.translate(Math.round(x),Math.round(footY));if(flip)ctx.scale(-1,1);ctx.drawImage(atlas,r[0],r[1],r[2],r[3],-ax,-dh,dw,dh);ctx.restore();}
function drawImageRect(r,x,y,w,h,alpha=1){if(!atlasReady||!r)return;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(atlas,r[0],r[1],r[2],r[3],Math.round(x),Math.round(y),Math.round(w),Math.round(h));ctx.restore();}
function drawBgSprite(r,x,y,scale=1,alpha=1){if(!atlasReady||!r)return;drawImageRect(r,x,y,r[2]*scale,r[3]*scale,alpha);}
function drawLandmark(name,x,y,scale=1,alpha=1){const r=LAND[name];if(!landmarkAtlasReady||!r)return;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(landmarkAtlas,r[0],r[1],r[2],r[3],Math.round(x),Math.round(y),r[2]*scale,r[3]*scale);ctx.restore();}
function drawActorFrame(meta,x,footY,scale=1,flip=false,alpha=1){if(!actorAtlasReady||!meta)return;const r=meta.r,a=meta.a,dw=Math.round(r[2]*scale),dh=Math.round(r[3]*scale),ax=Math.round(a[0]*scale),ay=Math.round(a[1]*scale);ctx.save();ctx.globalAlpha=alpha;ctx.translate(Math.round(x),Math.round(footY));if(flip)ctx.scale(-1,1);ctx.drawImage(actorAtlas,r[0],r[1],r[2],r[3],-ax,-ay,dw,dh);ctx.restore();}
function drawItem(key,x,y,size=38){const r=A.items[key];if(!atlasReady||!r)return;const ratio=r[2]/r[3],w=ratio>=1?size:size*ratio,h=ratio>=1?size/ratio:size;ctx.drawImage(atlas,r[0],r[1],r[2],r[3],x-w/2,y-h/2,w,h);}
function drawPortrait(key,x,y,w,h){const r=A.portraits[key];if(r)drawImageRect(r,x,y,w,h);}
function walkMeta(name,dir,frame){const seq=WALK[dir]||WALK.down;return ACT.walk[name][seq[frame%seq.length]];}
function drawPartySprite(name,dir,frame,x,footY,scale=WORLD_PARTY_SCALE,alpha=1){drawActorFrame(walkMeta(name,dir,frame),x,footY,scale,dir==='left',alpha);}
function drawEnemySprite(name,x,footY,scale=1,flip=false,alpha=1){drawActorFrame(ACT.enemy[name],x,footY,scale,flip,alpha);}
function drawNpcSprite(name,x,footY,scale=1,flip=false,alpha=1){drawActorFrame(ACT.npc[name],x,footY,scale,flip,alpha);}
function drawShadow(x,y,w=28,alpha=.25){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#0a1028';ctx.beginPath();ctx.ellipse(x,y,w,8,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawDiamond(x,y,color='#ffe970',r=8){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();ctx.fill();}
function statusText(u){const map={atkUp:'ATK↑',defUp:'DEF↑',magUp:'MAG↑',atkDown:'ATK↓',defDown:'DEF↓',magDown:'MAG↓',vulnerable:'VULN',regen:'REGEN',mpRegen:'MP+'};return Object.keys(u.status||{}).map(k=>map[k]).filter(Boolean).join(' ');}

/* ---------- World rendering ---------- */
function draw(){
  ctx.clearRect(0,0,W,H);
  if(mode==='title')drawTitle();
  else if(mode==='cutscene')drawCutscene();
  else if(mode==='battle')drawBattle();
  else if(mode==='ending')drawEnding();
  else {drawWorld();if(mode==='dialogue')drawDialogue();if(mode==='shop')drawShop();if(mode==='pause')drawPause();if(overlay==='map')drawMapOverlay();if(overlay==='quests')drawQuestOverlay();if(overlay==='status')drawStatusOverlay();if(overlay==='controls')drawControlsOverlay();}
  if(mode==='title'&&overlay==='controls')drawControlsOverlay();
  if(toast.time>0)drawToast();
  if(transition.alpha>0){ctx.fillStyle=`rgba(4,8,25,${transition.alpha})`;ctx.fillRect(0,0,W,H);}
}
function drawTitle(){
  ctx.fillStyle='#07123d';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#315f9d';ctx.fillRect(0,0,W,285);for(let x=0;x<W;x+=90){ctx.fillStyle='rgba(255,255,255,.09)';ctx.fillRect(x,40+(x%180?25:0),62,16);}
  drawLandmark('CAPITOL',770,84,4,.96);drawLandmark('MONUMENT',1080,80,3,.90);
  ctx.fillStyle='#315d3c';ctx.fillRect(0,270,W,450);ctx.fillStyle='#9b9ba0';ctx.fillRect(0,475,W,245);
  panel(65,58,690,600,'rgba(5,17,65,.94)','#f1f4ff',4);
  text('CAPITOL',105,102,54,'#fff');text('QUEST',105,155,70,'#ffe970');small('RESTORED EDITION',110,238,16,'#8ee2ff');
  wrap('A fictional 16-bit RPG about recovering a public record, tracing its source chain, and surviving the arguments in between.',108,282,585,26,16,'#dce5ff',4);
  const opts=getTitleOptions();opts.forEach((o,i)=>{const y=405+i*62;if(i===titleSelection){ctx.fillStyle='rgba(255,233,112,.13)';ctx.fillRect(102,y-8,585,51);text('▶',118,y,17,'#ffe970');}text(o.label,150,y,19,o.disabled?'#66708d':i===titleSelection?'#ffe970':'#fff');small(o.sub,360,y+4,12,o.disabled?'#58617d':'#bfc9eb');});
  small('Arrow keys / WASD • Enter confirm',110,600,12,'#aeb9df');small(`${VERSION} • fictional satire`,110,625,11,'#7f8aaf');
  ['TRUMP','HEGSETH','LUTNICK','RFK'].forEach((n,i)=>{drawPartySprite(n,'down',i%3,820+i*115,650,1.20);});
}
function drawCutscene(){
  drawStoryBackdrop();const p=cutscene.pages[cutscene.i];panel(72,388,1136,285,'rgba(5,17,66,.98)','#eef1ff',4);if(p.portrait)drawPortrait(p.portrait,96,420,120,150);const tx=p.portrait?245:105;text(p.speaker,tx,420,19,p.speaker==='NARRATOR'?'#8ee2ff':'#ffe970');wrap(p.text,tx,463,p.portrait?900:1060,31,19,'#fff',5);small(`${cutscene.i+1}/${cutscene.pages.length}  ENTER continue`,1150,640,12,'#c0cae8','right');
}
function drawStoryBackdrop(){ctx.fillStyle='#2f6cac';ctx.fillRect(0,0,W,H);ctx.fillStyle='#4f9559';ctx.fillRect(0,220,W,500);ctx.fillStyle='#a3a3a5';ctx.fillRect(0,410,W,310);drawLandmark('CAPITOL',760,96,4,.92);drawLandmark('MONUMENT',1065,110,3,.88);}

function drawWorld(){
  updateCamera();ctx.save();ctx.beginPath();ctx.rect(0,0,W,WORLD_VIEW_H);ctx.clip();
  const shake=screenShake&&state.settings.shake?[randInt(-screenShake,screenShake),randInt(-screenShake,screenShake)]:[0,0];ctx.translate(-camera.x+shake[0],-camera.y+shake[1]);drawMapBase(state.zone);drawMapObjects(state.zone);drawWorldEntities();ctx.restore();
  if(mode==='world'&&!overlay)drawWorldHUD();
}
function drawMapBase(z){
  const m=MAPS[z];if(m.theme==='outdoor')drawOutdoorBase(m);else drawInteriorBase(m,m.theme);
}
function drawOutdoorBase(m){
  ctx.fillStyle='#4d9358';ctx.fillRect(0,0,m.w,m.h);
  for(let x=0;x<m.w;x+=64)for(let y=0;y<m.h;y+=64){if((x/64+y/64)%3===0){ctx.fillStyle='rgba(28,91,47,.09)';ctx.fillRect(x,y,64,64);}}
  ctx.fillStyle='#a7a6a7';ctx.fillRect(0,660,m.w,160);ctx.fillRect(m.w*.46,80,160,m.h-160);
  ctx.fillStyle='rgba(255,255,255,.08)';for(let x=0;x<m.w;x+=64)ctx.fillRect(x,662,2,156);for(let y=680;y<810;y+=40)ctx.fillRect(0,y,m.w,2);
  // water feature
  if(state.zone==='MALL'){ctx.fillStyle='#327ab9';ctx.fillRect(650,455,760,145);for(let y=470;y<590;y+=24){ctx.fillStyle='rgba(192,230,255,.18)';ctx.fillRect(670,y,720,4);}}
  drawTreeLines(m);
}
function drawTreeLines(m){for(let x=120;x<m.w-100;x+=185){drawLandmark('TREE',x-43,90,2,.96);if(x%370<190)drawLandmark('TREE',x-43,m.h-235,2,.93);}}
function drawInteriorBase(m,theme){
  const floor=theme==='archive'?'#81736b':theme==='press'?'#777d84':theme==='hearing'?'#8a7b72':'#c8c3b8';ctx.fillStyle=floor;ctx.fillRect(0,0,m.w,m.h);
  for(let x=0;x<m.w;x+=64)for(let y=0;y<m.h;y+=64){ctx.strokeStyle='rgba(255,255,255,.10)';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,64,64);}
  ctx.fillStyle=theme==='archive'?'#3d2b2d':'#5f2730';ctx.fillRect(0,80,m.w,72);ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(0,152,m.w,5);
}
function drawMapObjects(z){
  if(z==='MALL'){
    drawLandmark('WHITEHOUSE',185,165,5,.98);text('PUBLIC EXHIBIT',383,555,17,'#f5f5ff','center');
    drawLandmark('MONUMENT',935,118,4,.96);drawLandmark('FOUNTAIN',1455,455,4,.95);
    drawBuilding(1580,165,400,280,'MUSEUM OF CIVIC RECORDS');drawTent(320,1020,'SUPPLY');drawGate(2050,690,'CAPITOL →');
  }else if(z==='GROUNDS'){
    drawLandmark('CAPITOL',720,72,6,.99);drawLandmark('FOUNTAIN',235,590,4,.96);
    drawServiceCart(500,930);drawHedges(1250,860,500,280);drawGate(70,950,'← MALL');drawGate(900,620,'ENTER');
  }else if(z==='ROTUNDA'){
    drawCarpet(710,290,200,770);for(let x of [220,390,1230,1400])for(let y=220;y<820;y+=190)drawColumn(x,y);drawSeal(810,245);drawImageRect(A.interior.SEAL,760,165,100,96,.9);drawImageRect(A.interior.FLAG,1040,315,70,165,.9);drawImageRect(A.interior.BUST,470,315,90,150,.92);drawDesk(670,500,280,130);drawGate(1440,760,'ARCHIVE →');drawGate(735,1020,'↓ GROUNDS');
  }else if(z==='ARCHIVE'){
    for(let x of [190,500,810,1120,1430])drawShelf(x,170,x===1120?420:650);drawReadingTable(690,920);drawImageRect(A.interior.PLANT,420,860,60,90,.88);drawImageRect(A.interior.POTPLANT,1320,850,70,95,.88);drawVault(870,760);drawGate(80,1030,'← CAPITOL');drawGate(1670,980,'PRESS →');
  }else if(z==='PRESS'){
    drawNewsDesk(180,190,'NEWS DESK');drawNewsDesk(600,190,'EDIT BAY');drawNewsDesk(1050,190,'FACT DESK');drawControlRoom(1400,180);drawLocker(760,610);drawImageRect(A.interior.PLANTS,1170,860,95,70,.86);drawImageRect(A.interior.DOOR,1510,655,95,178,.88);drawGate(70,960,'← ARCHIVE');drawGate(1540,950,'HEARING →');
  }else{
    drawDais(250,130,960,250);drawImageRect(A.interior.SEAL,680,150,100,100,.9);drawImageRect(A.interior.FLAG,1110,300,72,168,.9);drawImageRect(A.interior.BUST,275,330,80,135,.88);drawCarpet(650,370,160,620);drawGalleryBenches();drawGate(650,960,'↓ PRESS');
  }
  drawInteractableMarkers();
}
function drawBuilding(x,y,w,h,label){ctx.fillStyle='#d8d5ce';ctx.fillRect(x,y,w,h);ctx.fillStyle='#b9b5ae';ctx.fillRect(x+18,y+20,w-36,42);for(let i=0;i<6;i++){ctx.fillStyle='#687b8e';ctx.fillRect(x+30+i*(w-70)/6,y+92,30,78);}ctx.fillStyle='#6b442f';ctx.fillRect(x+w/2-45,y+h-88,90,88);text(label,x+w/2,y+h+14,14,'#fff','center');}
function drawTent(x,y,label){ctx.fillStyle='#dfd7c4';ctx.beginPath();ctx.moveTo(x,y+75);ctx.lineTo(x+90,y);ctx.lineTo(x+180,y+75);ctx.closePath();ctx.fill();ctx.fillStyle='#713f35';ctx.fillRect(x+20,y+75,140,105);text(label,x+90,y+115,16,'#fff','center');}
function drawGate(x,y,label){panel(x,y,145,42,'rgba(7,24,78,.92)','#e7edff',2);small(label,x+72,y+13,12,'#fff','center');}
function drawServiceCart(x,y){ctx.fillStyle='#655043';ctx.fillRect(x,y,260,92);ctx.fillStyle='#d4c9ae';ctx.fillRect(x+22,y+20,90,35);ctx.fillRect(x+145,y+20,90,35);ctx.fillStyle='#282b35';for(let xx of [x+55,x+205]){ctx.beginPath();ctx.arc(xx,y+94,20,0,Math.PI*2);ctx.fill();}small('MAINTENANCE C-4',x+130,y+110,12,'#fff','center');}
function drawHedges(x,y,w,h){ctx.fillStyle='#2f753d';ctx.fillRect(x,y,w,h);for(let xx=x+20;xx<x+w;xx+=70){ctx.fillStyle='#438f4d';ctx.beginPath();ctx.arc(xx,y+35,45,0,Math.PI*2);ctx.fill();}}
function drawCarpet(x,y,w,h){ctx.fillStyle='#7c1f2f';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#d5a74b';ctx.lineWidth=7;ctx.strokeRect(x+8,y+8,w-16,h-16);}
function drawColumn(x,y){ctx.fillStyle='#e5e0d4';ctx.fillRect(x+15,y,45,150);ctx.fillStyle='#c9c4bb';ctx.fillRect(x,y,75,18);ctx.fillRect(x,y+145,75,18);}
function drawSeal(x,y){ctx.fillStyle='#d7b04e';ctx.beginPath();ctx.arc(x,y,55,0,Math.PI*2);ctx.fill();ctx.fillStyle='#173366';ctx.beginPath();ctx.arc(x,y,43,0,Math.PI*2);ctx.fill();text('★',x,y-25,46,'#fff','center');}
function drawDesk(x,y,w,h){ctx.fillStyle='#6d3e2e';ctx.fillRect(x,y,w,h);ctx.fillStyle='#44251e';ctx.fillRect(x+18,y+20,w-36,25);}
function drawShelf(x,y,h){ctx.fillStyle='#3b2624';ctx.fillRect(x,y,210,h);for(let yy=y+25;yy<y+h-20;yy+=70){ctx.fillStyle='#80614c';ctx.fillRect(x+15,yy,180,12);for(let xx=x+24;xx<x+185;xx+=22){ctx.fillStyle=xx%44?'#657c9d':'#9d5e52';ctx.fillRect(xx,yy-43,15,43);}}}
function drawReadingTable(x,y){ctx.fillStyle='#6c4635';ctx.fillRect(x,y,510,115);ctx.fillStyle='#3e2a25';ctx.fillRect(x+25,y+30,460,20);}
function drawVault(x,y){ctx.fillStyle='#7b2635';ctx.fillRect(x,y,170,130);ctx.strokeStyle='#d9b26b';ctx.lineWidth=5;ctx.strokeRect(x+12,y+12,146,106);small('RED FILE VAULT',x+85,y+55,13,'#fff','center');}
function drawNewsDesk(x,y,label){ctx.fillStyle='#263852';ctx.fillRect(x,y,300,370);ctx.fillStyle='#bac3cf';ctx.fillRect(x+35,y+38,230,115);ctx.fillStyle='#5d2b35';ctx.fillRect(x+30,y+210,240,75);small(label,x+150,y+320,14,'#fff','center');}
function drawControlRoom(x,y){ctx.fillStyle='#1c2647';ctx.fillRect(x,y,210,420);ctx.fillStyle='#b8b8ae';ctx.fillRect(x+28,y+40,154,110);text('ON AIR',x+105,y+205,22,'#ffe970','center');}
function drawLocker(x,y){ctx.fillStyle='#4c5967';ctx.fillRect(x,y,160,125);ctx.strokeStyle='#d9dee8';ctx.lineWidth=3;ctx.strokeRect(x+12,y+12,136,101);small('SOURCE LOCKER',x+80,y+50,12,'#fff','center');}
function drawDais(x,y,w,h){ctx.fillStyle='#6a342e';ctx.fillRect(x,y,w,h);ctx.fillStyle='#47231f';ctx.fillRect(x+40,y+55,w-80,90);for(let xx=x+130;xx<x+w-100;xx+=210){ctx.fillStyle='#17356e';ctx.fillRect(xx,y+165,75,110);}}
function drawGalleryBenches(){for(let y of [540,720])for(let x of [300,910]){ctx.fillStyle='#71472f';ctx.fillRect(x,y,250,85);ctx.fillStyle='#4e2f23';ctx.fillRect(x+12,y+20,226,20);}}
function drawInteractableMarkers(){for(const it of interactables()){if(it.hidden?.())continue;const pulse=8+Math.sin(totalTime*4)*3;drawDiamond(it.x,it.y-58,it.icon?'#74e4ff':'#ffe970',pulse);if(it.icon)drawItem(it.icon,it.x,it.y-5,42);}}

function drawWorldEntities(){
  const actors=[];
  for(const n of npcList())actors.push({kind:'npc',y:n.y,n});
  for(const mob of WORLD_ENCOUNTERS[state.zone]||[]){if(state.defeated[mobKey(state.zone,mob.id)])continue;const mm=worldMobMotion[mobKey(state.zone,mob.id)]||{x:mob.x,y:mob.y,dir:'down'};actors.push({kind:'mob',y:mm.y,mob,mm});}
  // Followers use dense trail samples so they glide through turns instead of hopping between points.
  const followerDefs=['HEGSETH','LUTNICK','RFK'];followerDefs.forEach((name,i)=>{const tp=trail[Math.min(trail.length-1,18+i*26)]||state.player;actors.push({kind:'follower',y:tp.y,name,tp,i});});
  actors.push({kind:'player',y:state.player.y});actors.sort((a,b)=>a.y-b.y);
  for(const a of actors){if(a.kind==='npc')drawNPC(a.n);else if(a.kind==='mob')drawMob(a.mob,a.mm);else if(a.kind==='follower')drawFollower(a);else drawPlayer();}
}
function drawPlayer(){const p=state.player;drawShadow(p.x,p.y,28);drawPartySprite('TRUMP',p.dir,p.frame,p.x,p.y,WORLD_PARTY_SCALE);}
function drawFollower(a){drawShadow(a.tp.x,a.tp.y,27,.20);drawPartySprite(a.name,a.tp.dir||'down',a.tp.frame??0,a.tp.x,a.tp.y,WORLD_PARTY_SCALE,.96);}
function drawNPC(n){drawShadow(n.x,n.y,27,.22);if(ACT.npc[n.sprite])drawNpcSprite(n.sprite,n.x,n.y,1.42,false);else drawEnemySprite(n.sprite,n.x,n.y,.82,false);small(n.name,n.x,n.y-104,11,'#f3f5ff','center');}
function drawMob(m,mm){drawShadow(mm.x,mm.y,29,.22);drawEnemySprite(m.type,mm.x,mm.y,.82,mm.dir==='left');drawDiamond(mm.x,mm.y-108,'#ff7f7f',6+Math.sin(totalTime*5)*2);small('ENCOUNTER',mm.x,mm.y+8,9,'#ffd2d2','center');}

function drawWorldHUD(){
  // The HUD lives outside the 610px world viewport, so it never covers characters or interaction markers.
  ctx.fillStyle='#081447';ctx.fillRect(0,WORLD_VIEW_H,W,H-WORLD_VIEW_H);ctx.strokeStyle='#eef1ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,WORLD_VIEW_H+1.5);ctx.lineTo(W,WORLD_VIEW_H+1.5);ctx.stroke();
  const q=MAIN_STAGES[state.mainStage];text(MAPS[state.zone].name,20,620,16,'#fff');small(`CH ${state.chapter} • ${q.title}`,20,644,12,'#ffe970');small(q.desc,20,664,11,'#c7d1ef');
  state.party.forEach((p,i)=>{const x=535+i*176;drawPortrait(p.name,x,620,42,54);small(p.label,x+50,619,11,'#fff');small(`HP ${p.hp}/${p.maxHp}`,x+50,638,10);bar(x+50,654,112,8,p.hp,p.maxHp);small(`MP ${p.mp}/${p.maxMp}`,x+50,666,9,'#aee6ff');bar(x+50,679,112,7,p.mp,p.maxMp,'#74d9ff');});
  text(`$${state.cash}`,1250,619,16,'#ffe970','right');small(`USB ${state.evidence.usb}/4`,1250,643,11,'#75e1ff','right');small('M Map  Q Quests  I Party  Esc Menu',1250,691,9,'#b8c3e6','right');
  const ni=nearestInteraction();
  if(ni)small(`E / ENTER: ${ni.data.label||ni.data.name}`,20,691,10,'#ffe970');
  else {const ob=getObjective();small(ob?`OBJECTIVE: ${ob.label}${ob.zone!==state.zone?'  → '+MAPS[ob.zone].name:''}`:'OBJECTIVE COMPLETE',20,691,9,'#9ecdf6');}
}

function drawDialogue(){
  panel(38,350,1204,340,'rgba(5,17,66,.985)','#eef1ff',4);if(dialogue.portrait)drawPortrait(dialogue.portrait,70,390,126,158);const tx=dialogue.portrait?225:75;text(dialogue.speaker,tx,389,20,'#ffe970');wrap(dialogue.lines[dialogue.i],tx,438,dialogue.portrait?945:1100,31,19,'#fff',6);small('ENTER continue  •  ESC close',1170,654,12,'#c3cdec','right');
}
function drawShop(){
  panel(245,92,790,540,'rgba(5,17,66,.99)','#eef1ff',4);text('QUARTERMASTER',640,124,27,'#fff','center');small(`CASH  $${state.cash}`,640,162,14,'#ffe970','center');const list=Object.keys(ITEMS);list.forEach((key,i)=>{const it=ITEMS[key],y=215+i*58;if(i===shop.selected){ctx.fillStyle='rgba(255,233,112,.13)';ctx.fillRect(300,y-7,680,48);}drawItem(key,330,y+12,32);text(it.name,365,y,15,i===shop.selected?'#ffe970':'#fff');small(it.desc,520,y+3,11,'#c6d0eb');text(`$${it.price}`,920,y,14,'#ffe970','right');small(`x${state.inventory[key]||0}`,960,y+22,10,'#aab5d8','right');});small('↑↓ select  •  ENTER buy  •  ESC leave',640,590,12,'#c3cdec','center');
}
function drawPause(){
  panel(405,100,470,520,'rgba(4,14,57,.99)','#eef1ff',4);text('PAUSED',640,135,30,'#fff','center');pauseOptions().forEach((o,i)=>{const y=205+i*58;if(i===pauseSelection){ctx.fillStyle='rgba(255,233,112,.14)';ctx.fillRect(460,y-8,360,44);text('▶',475,y,15,'#ffe970');}text(o.label,515,y,16,i===pauseSelection?'#ffe970':'#fff');});small('ESC resume',640,598,10,'#b9c4e6','center');
}
function drawControlsOverlay(){
  panel(140,70,1000,580,'rgba(5,17,66,.99)','#eef1ff',4);text('CONTROLS & SYSTEMS',640,105,28,'#fff','center');const lines=[
    ['Move','Arrow keys / WASD'],['Interact / Confirm','E / Enter / Space'],['Back / Pause','Esc'],['Map / Quest Log','M / Q'],['Party / Inventory','I (or Pause menu)'],['Quick Save','F5'],['Battle menu','Arrow keys + Enter, or number keys 1–6'],['Battle targeting','Arrow keys + Enter'],['Limit skills','Build the pink LIMIT meter to 100%'],['Visible encounters','Touch a red-marked roaming sprite to fight; no random battles'],['Autosave','On major story progress and every 45 seconds']
  ];lines.forEach((l,i)=>{const y=165+i*36;text(l[0],220,y,14,'#ffe970');small(l[1],510,y+2,12,'#fff');});small('ESC close',640,610,12,'#c3cdec','center');
  if(!state.started)small('Returning closes this screen back to the title.',640,575,10,'#98a5ca','center');
}

function getObjective(){
  if(state.mainStage===0)return {zone:'MALL',x:610,y:650,label:'Speak with the Protester'};
  if(state.mainStage===1){if(!state.flags.veteranClue)return {zone:'MALL',x:960,y:900,label:'Interview the Veteran'};if(!state.flags.teacherClue)return {zone:'MALL',x:1240,y:770,label:'Interview the Teacher'};}
  if(state.mainStage===2)return {zone:'GROUNDS',x:610,y:940,label:'Recover the relay key'};
  if(state.mainStage===3)return {zone:'ROTUNDA',x:810,y:400,label:'Defeat the Capitol Sentinel'};
  if(state.mainStage===4)return {zone:'ARCHIVE',x:950,y:860,label:'Secure the Red Ledger'};
  if(state.mainStage===5)return state.flags.fixer?{zone:'PRESS',x:840,y:690,label:'Open the source locker'}:{zone:'PRESS',x:1510,y:650,label:'Stop the Media Fixer'};
  if(state.mainStage===6)return {zone:'PRESS',x:980,y:900,label:'Get Fact Checker sign-off'};
  if(state.mainStage===7)return {zone:'HEARING',x:730,y:430,label:'Win the final hearing'};
  if(state.mainStage===8)return {zone:'HEARING',x:730,y:430,label:'Choose the public-record procedure'};
  return null;
}
function drawMapOverlay(){
  panel(42,38,1196,642,'rgba(5,17,66,.99)','#eef1ff',4);text('DISTRICT MAP',78,70,25,'#fff');small(`${MAPS[state.zone].name} • local layout + route progress`,78,105,11,'#bfc9e8');
  // Current-zone schematic on the left. Solids, actors, encounters and objectives use the real world coordinates.
  const bx=82,by=150,bw=720,bh=430,m=MAPS[state.zone],sc=Math.min(bw/m.w,bh/m.h),ox=bx+(bw-m.w*sc)/2,oy=by+(bh-m.h*sc)/2;
  ctx.fillStyle='#25345f';ctx.fillRect(bx,by,bw,bh);ctx.strokeStyle='#8799cd';ctx.lineWidth=2;ctx.strokeRect(bx+.5,by+.5,bw-1,bh-1);
  ctx.fillStyle='rgba(215,221,235,.22)';for(const r of worldSolids(state.zone))ctx.fillRect(ox+r.x*sc,oy+r.y*sc,Math.max(2,r.w*sc),Math.max(2,r.h*sc));
  for(const n of npcList()){ctx.fillStyle='#78e2ff';ctx.beginPath();ctx.arc(ox+n.x*sc,oy+n.y*sc,4,0,Math.PI*2);ctx.fill();}
  for(const mob of WORLD_ENCOUNTERS[state.zone]||[]){if(state.defeated[mobKey(state.zone,mob.id)])continue;ctx.fillStyle='#ff7d7d';ctx.beginPath();ctx.arc(ox+mob.x*sc,oy+mob.y*sc,4,0,Math.PI*2);ctx.fill();}
  for(const it of interactables()){if(it.hidden?.())continue;ctx.fillStyle=it.icon?'#8ff3ff':'#ffd970';ctx.fillRect(ox+it.x*sc-3,oy+it.y*sc-3,6,6);}
  const ob=getObjective();if(ob&&ob.zone===state.zone){ctx.strokeStyle='#ffe970';ctx.lineWidth=3;ctx.beginPath();ctx.arc(ox+ob.x*sc,oy+ob.y*sc,10+Math.sin(totalTime*4)*2,0,Math.PI*2);ctx.stroke();}
  ctx.fillStyle='#ffe970';ctx.beginPath();ctx.arc(ox+state.player.x*sc,oy+state.player.y*sc,7,0,Math.PI*2);ctx.fill();small('YOU',ox+state.player.x*sc+10,oy+state.player.y*sc-6,9,'#ffe970');
  small('Cyan NPC • Red encounter • Gold exit/objective',bx,596,9,'#aeb9da');
  // Route progress on the right.
  text('ROUTE',845,150,14,'#8ee2ff');const route=['MALL','GROUNDS','ROTUNDA','ARCHIVE','PRESS','HEARING'];
  ctx.strokeStyle='#7184bd';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(885,195);ctx.lineTo(885,495);ctx.stroke();
  route.forEach((z,i)=>{const y=195+i*60,unlocked=isZoneUnlocked(z);ctx.fillStyle=z===state.zone?'#ffe970':unlocked?'#75dffc':'#4d5674';ctx.beginPath();ctx.arc(885,y,13,0,Math.PI*2);ctx.fill();small(MAPS[z].name,912,y-7,10,unlocked?'#fff':'#737e9e');});
  panel(835,530,350,90,'rgba(15,34,105,.78)','#6579b5',2);small('CURRENT OBJECTIVE',855,546,9,'#8ee2ff');wrap(ob?ob.label:'Case complete — postgame open.',855,565,300,20,11,'#fff',2);if(ob&&ob.zone!==state.zone)small(`Destination: ${MAPS[ob.zone].name}`,855,600,9,'#ffe970');
  small('M / ESC close',1180,644,10,'#bec9e7','right');
}
function isZoneUnlocked(z){const order=['MALL','GROUNDS','ROTUNDA','ARCHIVE','PRESS','HEARING'];const req=[0,0,3,4,5,7];return state.mainStage>=req[order.indexOf(z)];}
function drawStatusOverlay(){
  panel(55,42,1170,630,'rgba(5,17,66,.99)','#eef1ff',4);text('PARTY & INVENTORY',90,75,25,'#fff');small(`Cash $${state.cash} • Evidence ${state.evidence.files} originals + ${state.evidence.usb}/4 USB backups`,90,112,11,'#ffe970');
  state.party.forEach((p,i)=>{const x=90+(i%2)*555,y=160+Math.floor(i/2)*190;panel(x,y,520,165,'rgba(14,31,91,.78)','#6579b5',2);drawPortrait(p.name,x+18,y+18,86,108);text(p.label,x+122,y+18,16,'#fff');small(`LV ${p.lvl}   XP ${p.xp}/${p.lvl*115}`,x+122,y+45,10,'#aeb9da');small(`HP ${p.hp}/${p.maxHp}`,x+122,y+69,10,'#fff');bar(x+220,y+72,180,9,p.hp,p.maxHp);small(`MP ${p.mp}/${p.maxMp}`,x+122,y+91,10,'#bdeaff');bar(x+220,y+94,180,9,p.mp,p.maxMp,'#74d9ff');small(`ATK ${p.atk}   DEF ${p.def}   MAG ${p.mag}   LUCK ${p.luck}`,x+122,y+116,10,'#dbe3fa');small('LIMIT',x+122,y+138,9,'#f2b1ed');bar(x+180,y+140,220,8,p.limit,100,'#ff8de3');});
  text('SUPPLIES',90,552,12,'#8ee2ff');let ix=190;for(const k of Object.keys(ITEMS)){drawItem(k,ix,590,28);small(`${ITEMS[k].name} x${state.inventory[k]||0}`,ix+20,582,9,'#fff');ix+=165;}
  small('I / ESC close',1178,642,10,'#bec9e7','right');
}
function drawQuestOverlay(){
  panel(70,55,1140,610,'rgba(5,17,66,.99)','#eef1ff',4);text('QUESTS & EVIDENCE',110,90,26,'#fff');const q=MAIN_STAGES[state.mainStage];text('MAIN',110,145,13,'#8ee2ff');text(q.title,110,172,20,'#ffe970');wrap(q.desc,110,205,1000,25,15,'#fff',3);
  text('SIDE OBJECTIVES',110,300,13,'#8ee2ff');const wc=Object.values(state.witnesses).filter(Boolean).length;questRow(110,335,'Five Voices',`${Math.min(wc,5)}/5 distinct witnesses interviewed`,wc>=5);questRow(110,385,'Clean Backups',`${state.evidence.usb}/4 evidence USBs recovered`,state.evidence.usb>=4);
  text('EVIDENCE',670,300,13,'#8ee2ff');questRow(670,335,'Relay Key',state.flags.megaphone?'Recovered':'Missing',state.flags.megaphone);questRow(670,385,'Red Ledger',state.flags.ledger?'Secured':'Missing',state.flags.ledger);questRow(670,435,'Source Transcript',state.flags.transcript?'Secured':'Missing',state.flags.transcript);questRow(670,485,'Verification Card',state.flags.factChecked?'Signed':'Pending',state.flags.factChecked);
  small('Q / ESC close',1120,625,11,'#bec9e7','right');
}
function questRow(x,y,title,sub,done){ctx.fillStyle=done?'#ffe970':'#4f5877';ctx.fillRect(x,y,20,20);text(done?'✓':'·',x+10,y-1,14,done?'#07133e':'#dce5ff','center');text(title,x+34,y,14,done?'#fff':'#aab5d4');small(sub,x+34,y+22,10,'#aeb9da');}
function drawToast(){const a=clamp(toast.time<.25?toast.time/.25:1,0,1);ctx.save();ctx.globalAlpha=a;panel(345,15,590,48,'rgba(4,15,60,.96)','#dfe7ff',2);small(toast.text,640,31,13,'#fff','center');ctx.restore();}

/* ---------- Battle rendering ---------- */
function drawBattle(){
  const sx=screenShake&&state.settings.shake?randInt(-screenShake,screenShake):0,sy=screenShake&&state.settings.shake?randInt(-screenShake,screenShake):0;ctx.save();ctx.translate(sx,sy);ctx.beginPath();ctx.rect(0,0,W,BATTLE_VIEW_H);ctx.clip();drawBattleBackground();drawBattleUnits();drawBattleEffects();ctx.restore();drawBattleHUD();
}
function drawBattleBackground(){
  ctx.fillStyle='#3979c7';ctx.fillRect(0,0,W,BATTLE_VIEW_H);ctx.fillStyle='#88b7e9';ctx.fillRect(0,0,W,180);for(let x=20;x<W;x+=170){ctx.fillStyle='rgba(255,255,255,.36)';ctx.fillRect(x,50+(x%340?18:0),112,18);ctx.fillRect(x+28,37+(x%510?10:0),62,25);}ctx.fillStyle='#2f7041';ctx.fillRect(0,178,W,148);for(let x=0;x<W;x+=96)drawLandmark('TREE',x,160,2,.94);drawLandmark('CAPITOL',510,72,4,.98);ctx.fillStyle='#9a9a9e';ctx.fillRect(0,320,W,192);for(let y=336;y<512;y+=32){ctx.fillStyle='rgba(255,255,255,.09)';ctx.fillRect(0,y,W,2);}for(let x=0;x<W;x+=64){ctx.fillStyle='rgba(0,0,0,.05)';ctx.fillRect(x,320,2,192);}}
function drawBattleUnits(){
  state.party.forEach((p,i)=>{
    const pos=partyPos(p),scale=BATTLE_SCALE[p.name]||1.6;drawShadow(pos.x,pos.y,34,.24);
    if(!p.alive){drawActorFrame(ACT.action[p.name][BATTLE_IDLE_POSE[p.name]||0],pos.x,pos.y,scale,false,.22);return;}
    let x=pos.x,y=pos.y,meta=ACT.action[p.name][BATTLE_IDLE_POSE[p.name]||0];
    if(battle.phase==='action'&&battle.action?.actor===p){
      const a=battle.action,t=clamp(a.t/a.duration,0,1),strike=Math.sin(t*Math.PI),pose=a.pose??BASIC_POSE[p.name]??0;
      const offensive=a.kind==='basic'||(a.kind==='skill'&&['physical','magic','hybrid','physicalAll','magicAll','hybridAll'].includes(a.skill?.kind));
      if(offensive)x+=Math.round(strike*72);
      y-=Math.round(Math.sin(t*Math.PI)*3);
      // wind-up -> committed pose -> recovery; frame boundaries are time based, not crop-size based.
      meta=(t<.16||t>.88)?ACT.action[p.name][BATTLE_IDLE_POSE[p.name]||0]:ACT.action[p.name][pose];
    } else if(battle.phase==='enemyAction'&&battle.action?.kind==='enemy') x+=Math.round(Math.sin(battle.action.t*58)*1.2);
    drawActorFrame(meta,x,y,scale,false,1);
    const st=statusText(p);if(st)small(st,pos.x,pos.y+8,9,'#9ee7ff','center');
    if(battle.phase==='input'&&currentActor()===p){ctx.strokeStyle='#ffe970';ctx.lineWidth=3;ctx.strokeRect(pos.x-58,pos.y-158,116,170);}
    if(battle.phase==='target'&&battle.pending?.targetType==='ally'&&battleTargets()[battle.targetIndex]===p){ctx.strokeStyle='#75e1ff';ctx.lineWidth=3;ctx.strokeRect(pos.x-61,pos.y-161,122,176);}
  });
  battle.enemies.forEach((e,i)=>{
    const pos=enemyPos(e),scale=e.boss?1.16:1.02;drawShadow(pos.x,pos.y,40,.24);let x=pos.x,alpha=e.hp>0?1:.20;
    if(battle.phase==='enemyAction'&&battle.action?.actor===e){const t=clamp(battle.action.t/battle.action.duration,0,1);x-=Math.round(Math.sin(t*Math.PI)*74);}
    drawEnemySprite(e.sprite,x,pos.y,scale,false,alpha);
    if(e.hp>0){small(e.name,pos.x,pos.y+8,11,'#fff','center');bar(pos.x-60,pos.y+27,120,10,e.hp,e.maxHp,'#ff7c76');const st=statusText(e);if(st)small(st,pos.x,pos.y+42,9,'#d7b0ff','center');}else small('DOWN',pos.x,pos.y+12,10,'#ffaaa4','center');
    if((battle.phase==='target'&&battle.pending?.targetType==='enemy'&&aliveEnemies()[battle.targetIndex]===e)||(battle.phase==='analyze'&&aliveEnemies()[battle.targetIndex]===e)){ctx.strokeStyle='#ffe970';ctx.lineWidth=3;ctx.strokeRect(pos.x-72,pos.y-158,144,184);}
  });
}
function drawBattleEffects(){
  for(const fx of spriteFx){const frames=A.effects[fx.kind]||[],idx=Math.min(frames.length-1,Math.floor((fx.t/fx.duration)*frames.length)),r=frames[idx];if(r){const sc=fx.kind==='gun'?1.15:fx.kind==='hit'?1.25:1.1,w=r[2]*sc,h=r[3]*sc;drawImageRect(r,fx.x-w/2,fx.y-h/2,w,h,clamp(1-fx.t/fx.duration*.55,.35,1));}}
  for(const p of particles){ctx.globalAlpha=clamp(p.life/.55,0,1);ctx.fillStyle=p.kind==='heal'?'#77ff9f':p.kind==='buff'?'#70dfff':p.kind==='debuff'?'#bf7cff':p.kind==='magic'?'#d28aff':p.kind==='gun'?'#ffc65b':p.kind==='money'?'#9cff8f':'#ffb64f';ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;
  for(const f of floaters){ctx.globalAlpha=clamp(f.life/.9,0,1);text(f.text,f.x,f.y,18,f.color,'center');}ctx.globalAlpha=1;
}
function drawBattleHUD(){
  panel(14,12,1252,72,'rgba(6,18,73,.97)','#eef1ff',3);text(battle.message||'Choose an action.',36,31,16,'#fff');small(`ROUND ${battle.round}`,1235,34,11,'#ffe970','right');
  panel(14,522,822,186,'rgba(6,18,73,.985)','#eef1ff',3);state.party.forEach((p,i)=>{const y=540+i*39;text(p.label,30,y,13,p.alive?'#fff':'#777');small(`HP ${p.hp}/${p.maxHp}`,155,y+1,11);bar(280,y+4,132,10,p.hp,p.maxHp);small(`MP ${p.mp}/${p.maxMp}`,430,y+1,11,'#bdeaff');bar(555,y+4,105,10,p.mp,p.maxMp,'#74d9ff');small('LIM',674,y+1,9,'#f2b1ed');bar(708,y+4,104,10,p.limit,100,'#ff8de3');});
  panel(848,522,418,186,'rgba(6,18,73,.985)','#eef1ff',3);drawBattleMenuPanel();
}
function drawBattleMenuPanel(){
  if(battle.phase==='input'||battle.phase==='intro'){const cmds=['Attack','Skill','Item','Defend','Analyze','Run'];cmds.forEach((c,i)=>{const col=i%2,row=Math.floor(i/2),x=875+col*180,y=544+row*45;if(i===battle.menuIndex&&battle.phase==='input'){ctx.fillStyle='rgba(255,233,112,.13)';ctx.fillRect(x-8,y-4,165,31);text('▶',x,y,13,'#ffe970');}text(`${i+1} ${c}`,x+22,y,14,i===battle.menuIndex?'#ffe970':'#fff');});small('ARROWS / 1–6 • ENTER',1055,681,10,'#bcc7e7','center');}
  else if(battle.phase==='skills'){const ss=skillsFor(currentActor());text('SKILLS',875,541,13,'#ffe970');ss.forEach((s,i)=>{const y=570+i*25;if(i===battle.subIndex){ctx.fillStyle='rgba(255,233,112,.13)';ctx.fillRect(875,y-2,365,22);}text(i===battle.subIndex?'▶':' ',870,y,10,'#ffe970');small(`${s.name}  ${s.limit?'LIMIT':s.cost+' MP'}`,892,y,11,'#fff');});const s=ss[battle.subIndex];small(s?.desc||'',875,683,9,'#aeb9da');}
  else if(battle.phase==='items'){const is=battleItems();text('ITEMS',875,541,13,'#ffe970');is.forEach(([k,v],i)=>{const y=570+i*25;if(i===battle.subIndex){ctx.fillStyle='rgba(255,233,112,.13)';ctx.fillRect(875,y-2,365,22);}drawItem(k,890,y+7,18);small(`${ITEMS[k].name} x${v}`,908,y,11,'#fff');});small('ENTER choose ally • ESC back',875,683,9,'#aeb9da');}
  else if(battle.phase==='target'){text(`TARGET ${battle.pending?.targetType==='enemy'?'ENEMY':'ALLY'}`,875,546,15,'#ffe970');small('Arrow keys choose target',875,580,11,'#fff');small('ENTER confirm • ESC back',875,607,10,'#bec8e8');}
  else if(battle.phase==='analyze'){const e=aliveEnemies()[battle.targetIndex];text('ANALYZE',875,544,15,'#ffe970');small(e?.name||'',875,578,12,'#fff');small(e?.trait||'',875,602,11,'#8ee2ff');if(e)small(`HP ${e.hp}/${e.maxHp}  ATK ${e.atk}  DEF ${e.def}  MAG ${e.mag}`,875,624,9,'#d7dff6');small('ENTER mark vulnerable • ESC back',875,640,10,'#bec8e8');}
  else if(battle.phase==='enemyAction'){text('ENEMY TURN',875,550,18,'#ffaaa5');small(battle.action?.actor?.quote||'',875,585,11,'#fff');}
  else if(battle.phase==='message'){wrap(battle.message,875,548,360,24,13,'#fff',5);small('ENTER continue',875,681,10,'#bec8e8');}
  else if(battle.phase==='victory'){text('VICTORY',875,550,23,'#ffe970');wrap(battle.message,875,588,355,22,12,'#fff',3);}
  else if(battle.phase==='defeat'){text('DEFEAT',875,550,23,'#ff9c96');wrap(battle.message,875,588,355,22,12,'#fff',4);}
}

/* ---------- Ending rendering ---------- */
function drawEnding(){
  drawStoryBackdrop();panel(70,60,1140,600,'rgba(5,17,66,.985)','#eef1ff',4);if(ending.step==='choice'){text('THE PUBLIC RECORD',640,105,34,'#fff','center');wrap('The chain is verified. The final question is procedural: publish the source package immediately, or enter it into the hearing record before the public relay opens.',150,170,980,29,18,'#dfe6ff',4);const opts=[['1  BROADCAST NOW','Publish the full source package with corrections attached.'],['2  FILE WITH THE HEARING','Preserve the record in the hearing first, then broadcast it.']];opts.forEach((o,i)=>{const y=330+i*115;panel(160,y,960,85,i===ending.choice?'rgba(30,55,125,.96)':'rgba(14,31,91,.88)',i===ending.choice?'#ffe970':'#6f82b9',2);text(o[0],195,y+18,18,i===ending.choice?'#ffe970':'#fff');small(o[1],195,y+49,11,'#c9d2ed');});small('1 / 2 or arrow keys • ENTER choose',640,610,12,'#c1cbea','center');}
  else{const pages=endingPages();text('EPILOGUE',640,110,31,'#ffe970','center');wrap(pages[ending.page],160,205,960,35,21,'#fff',7);small(`${ending.page+1}/${pages.length}  ENTER continue`,1120,605,12,'#c1cbea','right');}
}

/* ---------- Loop / debug ---------- */
function loop(now){const dt=Math.min(.033,(now-last)/1000||0);last=now;update(dt);draw();requestAnimationFrame(loop);}requestAnimationFrame(loop);
setInterval(()=>{if(state.started&&mode==='world')saveGame(false);},45000);

// Optional rendering/debug entry points used for automated smoke tests.
window.__CQ__={state,A,ACT,BG,LAND,MAPS,PARTY_DEFS,ENEMY_DEFS,startBattle,zoneTransition,saveGame,loadGame,setStage,draw,update,VERSION,input:(k)=>handleInput(k),getBattle:()=>battle,getOverlay:()=>overlay,getObjective,interactables,worldSolids,freshState,startNewGame,get mode(){return mode;},setMode(v){mode=v;}};

// URL debug views do not affect normal play.
try{
  const dbg=new URLSearchParams(location.search).get('debug');
  if(dbg==='world'){Object.assign(state,freshState());state.started=true;state.mainStage=5;state.flags.megaphone=true;state.flags.sentinel=true;state.zone='ARCHIVE';state.player.x=950;state.player.y=1040;mode='world';resetTrail();}
  if(dbg==='battle'){Object.assign(state,freshState());state.started=true;startBattle([{type:'PROTESTER',level:4},{type:'TEACHER',level:4},{type:'VETERAN',level:4}],{gold:99,label:'DEBUG BATTLE'});battle.phase='input';}
}catch(e){}
