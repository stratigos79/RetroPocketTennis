(()=>{
'use strict';
const c=document.getElementById('game'),x=c.getContext('2d');
const W=1581,H=1080;
const LCD='#d9dbaa', INK='#30322d', RED='#a64d3e', GREEN='#4d8354';
const A=document.getElementById('gameA'),B=document.getElementById('gameB'),up=document.getElementById('up'),down=document.getElementById('down'),hit=document.getElementById('hit'),start=document.getElementById('start'),pause=document.getElementById('pause'),alarm=document.getElementById('alarm'),acl=document.getElementById('acl');
const lanes=[760,535,310];
let mode='A',running=false,paused=false,gameOver=false,lane=0,score=0,misses=0,best=+(localStorage.sptBest||0),balls=[],last=0,spawnTimer=.8,hitTimer=0,flash=0,seq=1,audio=null,showTime=false,clockTick=0;
function audioStart(){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume()}catch(e){}}
function tone(f=440,d=.05,g=.028){try{audioStart();if(!audio)return;const o=audio.createOscillator(),a=audio.createGain();o.type='square';o.frequency.value=f;a.gain.value=g;o.connect(a);a.connect(audio.destination);o.start();o.stop(audio.currentTime+d)}catch(e){}}
function startGame(){audioStart();score=0;misses=0;lane=0;balls=[];spawnTimer=.65;hitTimer=0;flash=0;gameOver=false;running=true;paused=false;start.textContent='START';pause.textContent='Ⅱ';last=performance.now();tone(660,.06);requestAnimationFrame(loop)}
function endGame(){running=false;gameOver=true;balls=[];if(score>best){best=score;localStorage.sptBest=best}start.textContent='PLAY AGAIN';tone(120,.12);setTimeout(()=>tone(80,.18),110)}
function miss(){misses++;flash=.18;tone(130,.10);balls=[];if(misses>=3)endGame();else spawnTimer=.65}
function move(d){if(!running||paused)return;const old=lane;lane=Math.max(0,Math.min(2,lane+d));if(old!==lane)tone(d<0?350:290,.025)}
function setMode(m){if(running)return;mode=m;A.classList.toggle('active',m==='A');B.classList.toggle('active',m==='B');draw()}
function hitSnoopy(){
 if(!running||paused||hitTimer>0)return; audioStart(); hitTimer=.18;
 let target=null,bestD=999;
 for(const b of balls){if((b.from==='charlie'||b.from==='lucy')&&b.x>990&&b.x<1165){const d=Math.abs(b.y-lanes[lane]);if(d<bestD){bestD=d;target=b}}}
 if(target&&bestD<60){const pts=target.from==='lucy'?3:2;score+=pts;balls.splice(balls.indexOf(target),1);tone(target.from==='lucy'?820:540,.055);balls.push({id:seq++,x:1125,y:lanes[lane],vx:-770,from:'return',lane,curve:target.from==='lucy'?35:25})} else tone(165,.035)
}
function spawnCharlie(){const li=Math.floor(Math.random()*3);const speed=(mode==='A'?245:280)+Math.min(score,900)*.055;balls.push({id:seq++,x:350,y:lanes[li],vx:speed,from:'charlie',lane:li,curve:42});spawnTimer=mode==='A'?Math.max(.48,1.02-score*.00055):Math.max(.30,.72-score*.0004)}
function maybeLucy(b){if(mode!=='B'||b.from!=='charlie'||b.x<760||b.x>980)return;if(Math.random()>(score<20?.22:.34))return;const i=balls.indexOf(b);if(i<0)return;balls.splice(i,1);balls.push({id:seq++,x:805,y:b.y,vx:b.vx*2,from:'lucy',lane:b.lane,curve:30});tone(250,.025)}
function update(dt){
 if(hitTimer>0)hitTimer-=dt;if(flash>0)flash-=dt;if(showTime){clockTick+=dt;return}
 spawnTimer-=dt;if(spawnTimer<=0&&balls.filter(b=>b.from!=='return').length<2)spawnCharlie();
 for(let i=balls.length-1;i>=0;i--){const b=balls[i];
  if(b.from==='charlie'||b.from==='lucy'){b.x+=b.vx*dt;const sx=b.from==='charlie'?350:805,ex=1125,p=Math.max(0,Math.min(1,(b.x-sx)/(ex-sx)));b.y=lanes[b.lane]-Math.sin(p*Math.PI)*b.curve;if(b.from==='charlie')maybeLucy(b);if((b.from==='charlie'||b.from==='lucy')&&b.x>1190){balls.splice(i,1);miss();break}}
  else{b.x+=b.vx*dt;const p=Math.max(0,Math.min(1,(b.x-1125)/(350-1125)));b.y=lanes[b.lane]-Math.sin(p*Math.PI)*(b.curve||25);if(b.x<300)balls.splice(i,1)}
 }
}
function rect(a,b,w,h,f=INK){x.fillStyle=f;x.fillRect(Math.round(a),Math.round(b),w,h)}
function text(s,a,b,z,align='center',f=INK){x.fillStyle=f;x.font=`700 ${z}px monospace`;x.textAlign=align;x.textBaseline='middle';x.fillText(s,a,b)}
// High-resolution LCD-style masks. These are deliberately shaped after the SP-30 character silhouettes,
// rather than generic humanoid blobs: Snoopy has the long muzzle/ears and Charlie Brown has his round head,
// striped shirt and separate legs. Lucy is a smaller dress silhouette for Game B.
function px(cx,cy,scale,rows){x.fillStyle=INK;const h=rows.length,w=Math.max(...rows.map(r=>r.length));for(let r=0;r<h;r++){const row=rows[r].padEnd(w,'0');for(let q=0;q<w;q++)if(row[q]==='1')x.fillRect(Math.round(cx+(q-w/2)*scale),Math.round(cy+(r-h/2)*scale),scale,scale)}}
const CHARLIE=[
".....#####.....",
"...###...###...",
"..##.......##..",
".##.........##.",
"##...........##",
"##...........##",
"##...........##",
".##.........##.",
"..###########..",
"....#######....",
"....#######....",
".....#####.....",
"....#######....",
"...#########...",
"..###########..",
"..####.######..",
"..####.######..",
"...###..#####..",
"...###...####..",
"...##.....###..",
"..###.....####.",
"..###......###.",
"..##.......###.",
"..##........##.",
".###........###",
];
const SNOOPY=[
"........###......",
"......######.....",
".....##....##....",
"....##......##...",
"...##........##..",
"..##..........##.",
".##............##",
"##..............#",
"##...............",
"##...............",
".##..............",
"..##.............",
"...######........",
"....#####........",
".....####........",
"......###........",
".....#####.......",
"....##...##......",
"....##....##.....",
"...##......##....",
"...##.......##...",
"..##........##...",
"..##........##...",
".###........###..",
];
const SNOOPY_HIT=[
"........###......",
"......######.....",
".....##....##....",
"....##......##...",
"...##........##..",
"..##..........##.",
".##............##",
"##..............#",
"##...............",
"##...............",
".##..............",
"..##.............",
"...######........",
"....#####........",
".....####........",
"......###........",
".....#####.......",
"....##...##......",
"....##....##.....",
"...##......##....",
"...##.......##...",
"..##........##...",
".##.........##...",
"##..........###..",
];
const LUCY=[
".....######.....",
"...###....###...",
"..##........##..",
".##..........##.",
"##............##",
"##............##",
"##............##",
".##..........##.",
"..###......###..",
"....########....",
".....######.....",
".....######.....",
"....########....",
"...##########...",
"..############..",
".##############.",
"###############.",
"######....######",
"#####......#####",
"####........####",
"###..........###",
"##............##",
"##............##",
"#..............#",
];
function drawPixelSprite(rows,cx,cy,scale){
  const w=Math.max(...rows.map(r=>r.length)), h=rows.length;
  x.fillStyle=INK;
  for(let r=0;r<h;r++){
    const row=rows[r].padEnd(w,'.');
    for(let q=0;q<w;q++) if(row[q]==='#') x.fillRect(Math.round(cx+(q-w/2)*scale),Math.round(cy+(r-h/2)*scale),scale,scale);
  }
}
function drawSnoopyPixel(cx,cy,scale,hitPose=false){
  drawPixelSprite(hitPose?SNOOPY_HIT:SNOOPY,cx,cy,scale);
  // Extra LCD segments reproduce Snoopy's long floppy ear, muzzle and racket hand.
  rect(cx-35*scale,cy-45*scale,7*scale,18*scale,INK);
  rect(cx-49*scale,cy-15*scale,10*scale,6*scale,INK);
  rect(cx-55*scale,cy-12*scale,7*scale,7*scale,INK);
  rect(cx-31*scale,cy-25*scale,5*scale,5*scale,INK);
  rect(cx-2*scale,cy+5*scale,7*scale,7*scale,INK);
  x.strokeStyle=INK;x.lineWidth=Math.max(3,scale);x.beginPath();
  x.moveTo(cx-1*scale,cy+2*scale);
  x.lineTo(cx+(hitPose?18:4)*scale,cy-(hitPose?16:11)*scale);x.stroke();
}
function drawDogHouse(){
  // Fixed coloured overlay visible at the lower-left of the real LCD.
  x.fillStyle=RED;x.beginPath();x.moveTo(120,900);x.lineTo(260,815);x.lineTo(400,900);x.closePath();x.fill();
  rect(145,895,230,130,RED);rect(225,945,70,80,LCD);
  rect(135,1010,245,15,RED);
}
function racket(cx,cy,swing=false){x.strokeStyle=INK;x.lineWidth=5;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+(swing?74:54),cy-(swing?36:28));x.stroke();x.lineWidth=4;x.beginPath();x.arc(cx+(swing?90:68),cy-(swing?47:35),23,0,Math.PI*2);x.stroke()}
function drawCharlie(){
  const y=lanes[0]+5;
  drawPixelSprite(CHARLIE,285,y,5);
  racket(345,y-8,false);
  rect(155,y+55,175,14,RED);rect(166,y+69,12,74,RED);
}
function drawSnoopy(){
  const y=lanes[lane]-8;
  drawSnoopyPixel(1110,y,5,hitTimer>0);
  racket(1088,y-4,hitTimer>0);
}
function drawLucy(){
  if(mode!=='B')return;
  const y=lanes[2]-2;
  drawPixelSprite(LUCY,800,y,4);
  racket(825,y-5,false);
  rect(740,y+48,135,13,RED);rect(750,y+61,11,47,RED);
}
function drawTree(){
  // Coloured LCD overlay: the characteristic crooked trunk, shelves and leaves.
  x.strokeStyle=RED;x.lineCap='square';x.lineWidth=25;x.beginPath();
  x.moveTo(1205,115);x.bezierCurveTo(1145,245,1148,360,1168,485);x.bezierCurveTo(1190,620,1178,760,1195,1025);x.stroke();
  const branches=[[1055,255,1208],[1038,435,1200],[1048,625,1210],[1060,810,1220],[1080,955,1250]];
  for(const b of branches){x.lineWidth=17;x.beginPath();x.moveTo(b[0],b[1]);x.lineTo(b[2],b[1]);x.stroke()}
  const leaves=[[1100,180],[1260,225],[1070,315],[1265,385],[1080,510],[1260,555],[1080,690],[1270,745],[1090,870],[1280,915]];
  for(const [a,b] of leaves){rect(a,b,31,13,GREEN);rect(a-7,b+5,9,7,GREEN)}
  rect(1145,1015,150,18,RED);rect(1160,1033,23,39,RED);rect(1260,1033,23,39,RED);
  // Woodstock's little nest at the top right.
  rect(1295,145,85,14,RED);rect(1310,130,60,12,RED);rect(1320,112,38,10,GREEN);rect(1330,101,20,11,GREEN);
}
function grass(){for(let i=0;i<62;i++){const gx=95+i*23,gy=1015+(i%2)*5;rect(gx,gy,8,5,GREEN);rect(gx+10,gy-5,7,5,GREEN)}}
function ball(b){rect(b.x-6,b.y-6,12,12,INK)}
function drawTime(){const d=new Date(),hh=d.getHours()%12||12,mm=String(d.getMinutes()).padStart(2,'0');text(`${hh}:${mm}`,W/2,540,80);text('AM',W/2-220,540,26);text('TIME',W/2,620,26)}
function draw(){
 x.fillStyle=LCD;x.fillRect(0,0,W,H);x.globalAlpha=.11;x.fillStyle=INK;for(let y=0;y<H;y+=7)x.fillRect(0,y,W,1);x.globalAlpha=1;x.strokeStyle='#626452';x.lineWidth=4;x.strokeRect(18,18,W-36,H-36);
 text('SNOOPY TENNIS',W/2,58,34);text('SCORE',70,115,19,'left');text(String(score).padStart(4,'0'),205,115,25,'left');text('MISS',650,115,19,'left');for(let i=0;i<3;i++){x.strokeStyle=INK;x.lineWidth=3;x.strokeRect(748+i*36,101,24,24);if(i<misses)rect(754+i*36,107,12,12)}text('BEST',1320,115,19);text(String(best).padStart(4,'0'),1460,115,25);
 drawTree();drawDogHouse();grass();drawCharlie();drawLucy();drawSnoopy();for(const b of balls)ball(b);if(showTime)drawTime();else if(!running&&!gameOver){text('SNOOPY TENNIS',W/2,505,40);text('PRESS START',W/2,555,22);text(`GAME ${mode}`,W/2,595,19)}else if(gameOver){text('GAME OVER',W/2,505,44);text(`SCORE ${String(score).padStart(4,'0')}`,W/2,560,22);text('PRESS START',W/2,610,19)}else if(paused){text('PAUSE',W/2,505,42);text(`GAME ${mode}`,W/2,555,20)}if(flash>0){x.globalAlpha=.22;x.fillStyle='#fff';x.fillRect(0,0,W,H);x.globalAlpha=1}}
function loop(t){if(!running){draw();return}const dt=Math.min(.04,(t-last)/1000);last=t;if(!paused&&!showTime)update(dt);draw();requestAnimationFrame(loop)}
up.onclick=()=>move(1);down.onclick=()=>move(-1);hit.onclick=hitSnoopy;start.onclick=()=>{if(!running||gameOver)startGame()};pause.onclick=()=>{if(running){paused=!paused;pause.textContent=paused?'▶':'Ⅱ';tone(paused?180:440,.03)}};A.onclick=()=>setMode('A');B.onclick=()=>setMode('B');alarm.onclick=()=>{showTime=!showTime;alarm.classList.toggle('active',showTime);if(showTime){tone(880,.08);if(running)paused=true}else tone(220,.05);draw()};acl.onclick=()=>{score=0;misses=0;balls=[];gameOver=false;running=false;paused=false;start.textContent='START';draw();tone(220,.08)};
window.onkeydown=e=>{if(e.key==='ArrowUp')move(1);if(e.key==='ArrowDown')move(-1);if(e.key===' '||e.key==='Enter')hitSnoopy();if(e.key.toLowerCase()==='p')pause.click();if(e.key.toLowerCase()==='a')setMode('A');if(e.key.toLowerCase()==='b')setMode('B')};A.classList.add('active');draw();
})();
