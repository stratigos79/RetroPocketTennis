(()=>{
'use strict';
const c=document.getElementById('game'),x=c.getContext('2d');
const W=1581,H=1080;
const A=document.getElementById('gameA'),B=document.getElementById('gameB'),up=document.getElementById('up'),down=document.getElementById('down'),hit=document.getElementById('hit'),start=document.getElementById('start'),pause=document.getElementById('pause'),alarm=document.getElementById('alarm'),acl=document.getElementById('acl');
const LCD='#d9dbac',INK='#303229',DARK='#24251f',RED='#a44d3d',GREEN='#4f8555';
const laneY=[330,545,760], snoopyX=1165, charlieX=360, lucyX=1020;
let mode='A',running=false,paused=false,lane=1,score=0,misses=0,best=+(localStorage.sptBest||0),balls=[],last=0,serve=.8,hitCooldown=0,flash=0,gameOver=false,seq=0,audio=null,alarmOn=false,sleeping=false;
function audioStart(){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume()}catch(e){}}
function tone(f=440,d=.05,type='square',g=.035){try{audioStart();if(!audio)return;const o=audio.createOscillator(),a=audio.createGain();o.type=type;o.frequency.value=f;a.gain.value=g;o.connect(a);a.connect(audio.destination);o.start();o.stop(audio.currentTime+d)}catch(e){}}
function startGame(){audioStart();score=0;misses=0;lane=1;balls=[];serve=.7;hitCooldown=0;flash=0;running=true;paused=false;gameOver=false;sleeping=false;start.textContent='START';pause.textContent='Ⅱ';last=performance.now();tone(660,.07);requestAnimationFrame(loop)}
function endGame(){running=false;gameOver=true;sleeping=true;balls=[];if(score>best){best=score;localStorage.sptBest=best}start.textContent='PLAY AGAIN';tone(110,.18,'square',.05);setTimeout(()=>tone(80,.24,'square',.04),110)}
function miss(){misses++;flash=.22;tone(135,.13);balls=[];if(misses>=3)endGame();else serve=.7}
function setMode(m){if(running)return;mode=m;A.classList.toggle('active',m==='A');B.classList.toggle('active',m==='B');draw()}
function move(d){if(!running||paused||sleeping)return;const old=lane;lane=Math.max(0,Math.min(2,lane+d));if(old!==lane)tone(d<0?330:380,.025)}
function hitSnoopy(){
 if(!running||paused||hitCooldown>0)return; audioStart(); hitCooldown=.14;
 const tx=snoopyX-55; let target=null,bd=999;
 for(const b of balls){if((b.from==='charlie'||b.from==='lucy')&&b.x>tx-120&&b.x<tx+50){const d=Math.abs(b.y-laneY[lane]);if(d<bd){bd=d;target=b}}}
 if(target&&bd<42){const pts=target.from==='lucy'?3:2;score+=pts;balls.splice(balls.indexOf(target),1);tone(target.from==='lucy'?780:540,.06);balls.push({id:seq++,x:snoopyX-55,y:laneY[lane],vx:-690,vy:0,from:'return',lane,t:0});}
 else tone(170,.035);
}
function spawn(){
 const speed=(mode==='A'?245:300)+Math.min(score,1200)*.045;
 const l=Math.floor(Math.random()*3);
 balls.push({id:seq++,x:charlieX+85,y:laneY[l],vx:speed,vy:(laneY[l]-laneY[l])*0,from:'charlie',lane:l,t:0});
 serve=mode==='A'?Math.max(.62,1.02-score*.0007):Math.max(.36,.72-score*.0005);
}
function maybeLucy(b){
 if(mode!=='B'||b.from!=='charlie'||b.x<790||b.x>965)return;
 const chance=score<20?.16:.28;
 if(Math.random()>chance)return;
 const i=balls.indexOf(b);if(i<0)return;balls.splice(i,1);
 balls.push({id:seq++,x:lucyX-35,y:b.y,vx:b.vx*2.05,vy:0,from:'lucy',lane:b.lane,t:0});
 tone(240,.03);
}
function update(dt){
 if(hitCooldown>0)hitCooldown-=dt;if(serve>0)serve-=dt;
 else if(balls.filter(b=>b.from!=='return').length<(mode==='A'?1:2))spawn();
 for(let i=balls.length-1;i>=0;i--){const b=balls[i];
   b.t=(b.t||0)+dt;
   const startX=b.from==='charlie'?charlieX+85:lucyX-35;
   const endX=snoopyX-55;
   if(b.from==='charlie'||b.from==='lucy'){
     b.x+=b.vx*dt;
     const p=Math.max(0,Math.min(1,(b.x-startX)/(endX-startX)));
     b.y=laneY[b.lane] + Math.sin(p*Math.PI)*(-70);
   } else if(b.from==='return'){
     b.x+=b.vx*dt;
     const p=Math.max(0,Math.min(1,(snoopyX-55-b.x)/(snoopyX-55-210)));
     b.y=laneY[b.lane] + Math.sin(p*Math.PI)*(-55);
   }
   if(b.from==='charlie')maybeLucy(b);
   if(b.from==='return'&&b.x<210){balls.splice(i,1);continue}
   if((b.from==='charlie'||b.from==='lucy')&&b.x>snoopyX+40){balls.splice(i,1);miss();break}
 }
 if(flash>0)flash-=dt;
}
function rect(a,b,w,h,fill=INK){x.fillStyle=fill;x.fillRect(Math.round(a),Math.round(b),w,h)}
function text(s,a,b,z,align='center',fill=INK){x.fillStyle=fill;x.font=`700 ${z}px monospace`;x.textAlign=align;x.textBaseline='middle';x.fillText(s,a,b)}
function pixelSnoopy(px0,py0,pose='ready'){
 x.save();x.translate(px0,py0);x.fillStyle=INK;
 // compact LCD-like Snoopy silhouette
 rect(-24,-34,43,35);rect(15,-27,19,26);rect(-37,-21,14,7);
 rect(-8,-47,9,15);rect(14,-45,8,13);rect(30,-8,8,7);
 rect(-15,2,8,29);rect(8,2,8,29);rect(-20,30,13,5);rect(6,30,15,5);
 if(pose==='swing'){rect(23,-2,66,5);rect(84,-34,5,37);rect(80,-38,17,5)}
 else {rect(28,-2,56,5);rect(81,-31,5,35)}
 x.restore();
}
function pixelCharlie(px0,py0,pose='ready'){
 x.save();x.translate(px0,py0);x.fillStyle=INK;
 rect(-18,-38,34,43);rect(-25,-29,49,10);rect(-11,5,8,31);rect(6,5,8,31);
 rect(-30,36,23,5);rect(8,36,23,5);rect(-5,-50,8,13);
 // racket held toward Snoopy
 x.strokeStyle=INK;x.lineWidth=5;x.beginPath();x.moveTo(20,-5);x.lineTo(72,-42);x.stroke();x.beginPath();x.arc(82,-50,23,0,Math.PI*2);x.stroke();
 if(pose==='miss'){rect(27,5,8,30);x.strokeStyle=INK;x.lineWidth=5;x.beginPath();x.moveTo(27,8);x.lineTo(62,34);x.stroke()}
 x.restore();
}
function pixelLucy(px0,py0){
 x.save();x.translate(px0,py0);x.fillStyle=INK;
 rect(-18,-38,35,42);rect(-29,-29,55,10);rect(-12,4,8,34);rect(8,4,8,34);rect(-30,38,22,5);rect(9,38,22,5);rect(-5,-50,8,13);
 // tennis racket angled toward Snoopy
 x.strokeStyle=INK;x.lineWidth=5;x.beginPath();x.moveTo(24,-2);x.lineTo(63,-32);x.stroke();x.beginPath();x.arc(72,-39,18,0,Math.PI*2);x.stroke();
 x.restore();
}
function doghouse(){
 x.fillStyle=RED;
 x.beginPath();x.moveTo(180,900);x.lineTo(350,805);x.lineTo(520,900);x.closePath();x.fill();
 rect(205,900,305,135,RED);rect(315,940,90,95,LCD);
 rect(225,1010,30,40,RED);rect(465,1010,30,40,RED);
 if(sleeping){pixelSnoopy(335,870,'sleep');rect(307,838,22,5,INK)}
}
function branch(x1,y,x2){x.strokeStyle=RED;x.lineWidth=20;x.beginPath();x.moveTo(x1,y);x.lineTo(x2,y);x.stroke()}
function tree(){
 x.strokeStyle=RED;x.lineCap='round';x.lineWidth=28;x.beginPath();x.moveTo(1165,210);x.bezierCurveTo(1095,350,1110,550,1165,1000);x.stroke();
 branch(1085,350,1260);branch(1065,545,1270);branch(1080,760,1280);
 x.fillStyle=GREEN;
 [[1110,310],[1215,370],[1080,510],[1220,610],[1100,700],[1230,820],[1125,900],[1195,275]].forEach(q=>{rect(q[0],q[1],28,16,GREEN);rect(q[0]-7,q[1]+5,7,8,GREEN)});
 // small upper branch / Lucy perch
 branch(1005,315,1095);
 rect(1030,282,14,30,GREEN);rect(1058,275,22,12,GREEN);
 rect(1135,985,150,28,RED);rect(1155,1013,28,42,RED);rect(1230,1013,28,42,RED);
}
function draw(){
 x.fillStyle=LCD;x.fillRect(0,0,W,H);
 x.globalAlpha=.11;x.fillStyle=INK;for(let y=0;y<H;y+=7)x.fillRect(0,y,W,1);x.globalAlpha=1;
 x.strokeStyle='#666856';x.lineWidth=5;x.strokeRect(18,18,W-36,H-36);
 text('SNOOPY TENNIS',W/2,58,36);
 text('SCORE',72,118,20,'left');text(String(score).padStart(4,'0'),215,118,27,'left');
 text('MISS',620,118,20,'left');for(let i=0;i<3;i++){x.strokeStyle=INK;x.lineWidth=3;x.strokeRect(720+i*38,103,25,25);if(i<misses)rect(726+i*38,109,13,13)}
 text('BEST',1330,118,20);text(String(best).padStart(4,'0'),1475,118,27);
 doghouse();tree();
 pixelCharlie(charlieX,laneY[lane],gameOver?'miss':'ready');
 pixelSnoopy(snoopyX,laneY[lane],hitCooldown>0?'swing':'ready');
 if(mode==='B')pixelLucy(1035,315);
 for(const b of balls){rect(b.x-4,b.y-4,9,9,INK);if(b.from==='return')rect(b.x+7,b.y-2,7,4,INK)}
 if(!running&&!gameOver){text('SNOOPY TENNIS',W/2,500,40);text('PRESS START',W/2,555,22);text(`GAME ${mode}`,W/2,595,20)}
 if(gameOver){text('GAME OVER',W/2,500,44);text(`SCORE ${String(score).padStart(4,'0')}`,W/2,555,23)}
 if(paused&&running){text('PAUSE',W/2,500,42);text(`GAME ${mode}`,W/2,550,20)}
 if(flash>0){x.globalAlpha=Math.min(.30,flash*1.5);x.fillStyle='#fff';x.fillRect(0,0,W,H);x.globalAlpha=1}
}
function loop(t){if(!running){draw();return}const dt=Math.min(.04,(t-last)/1000);last=t;if(!paused)update(dt);draw();requestAnimationFrame(loop)}
up.onclick=()=>move(-1);down.onclick=()=>move(1);hit.onclick=hitSnoopy;start.onclick=startGame;
pause.onclick=()=>{if(running){paused=!paused;pause.textContent=paused?'▶':'Ⅱ';tone(paused?180:440,.03)}};
A.onclick=()=>setMode('A');B.onclick=()=>setMode('B');
alarm.onclick=()=>{alarmOn=!alarmOn;alarm.classList.toggle('active',alarmOn);tone(alarmOn?880:220,.08)};
acl.onclick=()=>{score=0;misses=0;balls=[];sleeping=false;gameOver=false;draw();tone(220,.08)};
window.onkeydown=e=>{if(e.key==='ArrowUp')move(-1);if(e.key==='ArrowDown')move(1);if(e.key===' '||e.key==='Enter')hitSnoopy();if(e.key.toLowerCase()==='p')pause.click();if(e.key.toLowerCase()==='a')setMode('A');if(e.key.toLowerCase()==='b')setMode('B')};
A.classList.add('active');draw();
})();
