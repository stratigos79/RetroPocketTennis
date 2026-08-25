const c=document.getElementById('game'),ctx=c.getContext('2d');

const scoreEl=document.getElementById('score');
const bestEl=document.getElementById('best');
const modeEl=document.getElementById('mode');
const startBtn=document.getElementById('start');
const pauseBtn=document.getElementById('pause');
const upBtn=document.getElementById('up');
const downBtn=document.getElementById('down');
const hitBtn=document.getElementById('hit');
const aBtn=document.getElementById('gameA');
const bBtn=document.getElementById('gameB');

let best=Number(localStorage.retroPocketSnoopyBest||0);
let score=0;
let misses=0;
let lane=1;
let running=false;
let paused=false;
let last=0;
let mode='A';
let chance=false;
let chanceTimer=0;
let audio;

let balls=[];
let returnBall=null;
let serveTimer=0;
let hitLock=0;

const lanes=[310,505,700];
const treeX=545;
const charlieX=150;
const lucyX=535;

const W=c.width=720;
const H=c.height=1100;

bestEl.textContent=best;

function beep(f=440,d=.035){
  try{
    audio=audio||new(window.AudioContext||window.webkitAudioContext)();

    const o=audio.createOscillator();
    const g=audio.createGain();

    o.type='square';
    o.frequency.value=f;
    g.gain.value=.035;

    o.connect(g);
    g.connect(audio.destination);

    o.start();
    o.stop(audio.currentTime+d);
  }catch(e){}
}

function reset(){

  score=0;
  misses=0;
  lane=1;

  balls=[];
  returnBall=null;

  serveTimer=.35;
  hitLock=0;

  chance=false;
  chanceTimer=0;

  paused=false;
  running=true;

  scoreEl.textContent='0';
  modeEl.textContent='GAME '+mode;

  startBtn.classList.add('hide');
  pauseBtn.textContent='Ⅱ';

  last=performance.now();

  beep(660,.06);

  requestAnimationFrame(loop);
}

function endGame(){

  running=false;

  balls=[];
  returnBall=null;

  startBtn.textContent='PLAY AGAIN';
  startBtn.classList.remove('hide');

  if(score>best){

    best=score;

    localStorage.retroPocketSnoopyBest=best;

    bestEl.textContent=best;
  }

  beep(110,.16);
}

function miss(){

  misses++;

  balls=[];
  returnBall=null;

  beep(120,.12);

  if(misses>=3){

    endGame();

  }else{

    serveTimer=.7;
  }
}

function togglePause(){

  if(!running)return;

  paused=!paused;

  pauseBtn.textContent=paused?'▶':'Ⅱ';

  if(!paused){

    last=performance.now();

    requestAnimationFrame(loop);
  }
}

function setMode(m){

  if(running)return;

  mode=m;

  modeEl.textContent='GAME '+mode;

  aBtn.classList.toggle('active',m==='A');
  bBtn.classList.toggle('active',m==='B');

  draw();
}

function move(d){

  if(!running||paused||hitLock>0)return;

  lane=Math.max(0,Math.min(2,lane+d));

  beep(d<0?300:360,.018);
}

function hit(){

  if(!running||paused||hitLock>0)return;

  hitLock=.18;

  const y=lanes[lane];

  let target=null;
  let bd=999;

  for(const b of balls){

    if(b.x>455 && Math.abs(b.y-y)<bd){

      bd=Math.abs(b.y-y);
      target=b;
    }
  }

  if(target && bd<52){

    const s=target.from;

    balls.splice(balls.indexOf(target),1);

    score+=chance
      ?(s==='lucy'?6:4)
      :(s==='lucy'?3:2);

    scoreEl.textContent=score;

    returnBall={
      x:treeX-30,
      y,
      t:.2
    };

    beep(s==='lucy'?720:520,.035);

    if(score && score%100===0 && misses===0){

      chance=true;
      chanceTimer=58;
    }

  }else{

    beep(180,.025);
  }
}

function spawn(){

  const v=
    (mode==='B'?245:205)
    +Math.min(score,700)*.075;

  const l=Math.floor(Math.random()*3);

  balls.push({
    x:charlieX+55,
    y:lanes[l],
    vx:v,
    from:'charlie',
    lane:l
  });

  serveTimer=Math.max(
    .52,
    1.03-score*.0016
  );
}

function update(dt){

  if(chanceTimer>0){

    chanceTimer-=dt;

    if(chanceTimer<=0)
      chance=false;
  }

  hitLock=Math.max(0,hitLock-dt);

  if(serveTimer>0){

    serveTimer-=dt;

  }else{

    spawn();
  }

  for(const b of balls)
    b.x+=b.vx*dt;

  for(let i=balls.length-1;i>=0;i--){

    const b=balls[i];

    /*
      Charlie Brown can send Lucy.
      Lucy moves twice as fast.
    */

    if(
      b.from==='charlie' &&
      b.x>=treeX-75 &&
      b.x<=treeX-35 &&
      score>20 &&
      Math.random()<(mode==='B'?.22:.13)
    ){

      balls.push({
        x:lucyX-35,
        y:b.y,
        vx:b.vx*2,
        from:'lucy',
        lane:b.lane
      });

      balls.splice(i,1);

      continue;
    }

    if(b.x>treeX+80){

      balls.splice(i,1);

      miss();

      break;
    }
  }

  if(returnBall){

    returnBall.t-=dt;

    returnBall.x-=220*dt;

    if(returnBall.t<=0)
      returnBall=null;
  }
}

function txt(s,x,y,z){

  ctx.font='900 '+z+'px monospace';

  ctx.textAlign='center';

  ctx.fillText(
    s,
    Math.round(x/5)*5,
    Math.round(y/5)*5
  );
}

function draw(){

  /*
    LCD background
  */

  ctx.fillStyle='#e9e5bd';

  ctx.fillRect(0,0,W,H);

  ctx.fillStyle='#111';

  /*
    Header
  */

  txt(
    'SNOOPY TENNIS',
    W/2,
    65,
    31
  );

  txt(
    'NINTENDO SP-30',
    W/2,
    92,
    13
  );

  /*
    Game screen
  */

  ctx.strokeStyle='#111';

  ctx.lineWidth=4;

  ctx.strokeRect(
    20,
    120,
    W-40,
    790
  );

  /*
    Tree trunk
  */

  ctx.lineWidth=18;

  ctx.beginPath();

  ctx.moveTo(
    treeX+25,
    180
  );

  ctx.quadraticCurveTo(
    treeX-30,
    500,
    treeX+15,
    880
  );

  ctx.stroke();

  /*
    Three branches / positions
  */

  ctx.lineWidth=9;

  for(const y of lanes){

    ctx.beginPath();

    ctx.moveTo(
      treeX-15,
      y
    );

    ctx.lineTo(
      treeX+110,
      y
    );

    ctx.stroke();
  }

  /*
    Charlie Brown
  */

  ctx.fillStyle='#111';

  ctx.fillRect(
    charlieX-14,
    850,
    28,
    65
  );

  ctx.fillRect(
    charlieX-28,
    855,
    56,
    16
  );

  ctx.fillRect(
    charlieX-35,
    920,
    20,
    10
  );

  ctx.fillRect(
    charlieX+15,
    920,
    20,
    10
  );

  /*
    Lucy
  */

  if(score>=18){

    const y=
      lanes[
        (Math.floor(score/7)+1)%3
      ]-70;

    ctx.fillRect(
      lucyX-20,
      y,
      42,
      48
    );

    ctx.fillRect(
      lucyX-28,
      y-18,
      56,
      22
    );

    txt(
      'LUCY',
      lucyX,
      y-28,
      12
    );
  }

  /*
    Snoopy
  */

  const sy=lanes[lane];

  ctx.save();

  ctx.translate(
    treeX,
    sy-58
  );

  ctx.fillRect(
    -22,
    -25,
    40,
    38
  );

  ctx.fillRect(
    14,
    -15,
    28,
    25
  );

  ctx.fillRect(
    -28,
    -15,
    10,
    8
  );

  ctx.fillRect(
    -10,
    -35,
    8,
    12
  );

  ctx.fillRect(
    10,
    -35,
    8,
    12
  );

  ctx.fillRect(
    34,
    -8,
    5,
    5
  );

  ctx.fillRect(
    -4,
    13,
    9,
    28
  );

  ctx.fillRect(
    20,
    13,
    9,
    28
  );

  /*
    Racket
  */

  ctx.fillRect(
    39,
    -2,
    27,
    5
  );

  ctx.restore();

  /*
    Balls
  */

  for(const b of balls){

    ctx.fillRect(
      Math.round(b.x/5)*5-6,
      Math.round(b.y/5)*5-6,
      12,
      12
    );
  }

  if(returnBall){

    ctx.fillRect(
      Math.round(returnBall.x/5)*5-6,
      Math.round(returnBall.y/5)*5-6,
      12,
      12
    );
  }

  /*
    Bottom LCD display
  */

  txt(
    'SCORE',
    80,
    965,
    15
  );

  txt(
    String(score).padStart(4,'0'),
    80,
    990,
    25
  );

  txt(
    chance?'CHANCE!':'MISSES',
    360,
    965,
    15
  );

  /*
    Three misses
  */

  for(let i=0;i<3;i++){

    ctx.strokeRect(
      270+i*32,
      940,
      22,
      22
    );

    if(i<misses){

      ctx.beginPath();

      ctx.moveTo(
        273+i*32,
        943
      );

      ctx.lineTo(
        289+i*32,
        959
      );

      ctx.moveTo(
        289+i*32,
        943
      );

      ctx.lineTo(
        273+i*32,
        959
      );

      ctx.stroke();
    }
  }

  txt(
    'BEST '+String(best).padStart(4,'0'),
    610,
    985,
    15
  );

  /*
    Game Over
  */

  if(!running){

    txt(
      'GAME OVER',
      W/2,
      540,
      38
    );
  }

  /*
    Pause
  */

  if(paused){

    ctx.fillStyle='#e9e5bd';

    ctx.globalAlpha=.9;

    ctx.fillRect(
      20,
      120,
      W-40,
      790
    );

    ctx.globalAlpha=1;

    ctx.fillStyle='#111';

    txt(
      'PAUSE',
      W/2,
      530,
      38
    );
  }
}

function loop(t){

  if(!running){

    draw();

    return;
  }

  draw();

  if(paused){

    requestAnimationFrame(loop);

    return;
  }

  const dt=Math.min(
    .033,
    (t-last)/1000
  );

  last=t;

  update(dt);

  requestAnimationFrame(loop);
}

/*
  Touch controls
*/

upBtn.onclick=()=>move(-1);

downBtn.onclick=()=>move(1);

hitBtn.onclick=hit;

pauseBtn.onclick=togglePause;

startBtn.onclick=reset;

aBtn.onclick=()=>setMode('A');

bBtn.onclick=()=>setMode('B');

/*
  Keyboard
*/

window.onkeydown=e=>{

  if(e.key==='ArrowUp')
    move(-1);

  if(e.key==='ArrowDown')
    move(1);

  if(e.key===' '||e.key==='Enter')
    hit();

  if(e.key==='p'||e.key==='P')
    togglePause();
};

aBtn.classList.add('active');

draw();
