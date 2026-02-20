const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const companySelect = document.getElementById('companySelect');
const startBtn = document.getElementById('startBtn');
const hud = document.getElementById('hud');

function resize(){
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * devicePixelRatio);
  canvas.height = Math.floor(rect.height * devicePixelRatio);
}
window.addEventListener('resize', resize);

const COMPANIES = ["SpaceX","Blue Origin","ULA","Arianespace","Rocket Lab","Relativity","Firefly","Stoke","Isar","PLD Space"];
const DEBRIS = ["Debris: spent stage","Debris: fairing","Debris: bolt","Debris: panel","Debris: cubesat fragment"];
const NATURAL = ["Asteroid: C-type","Asteroid: S-type","Asteroid: M-type","Meteoroid"];

COMPANIES.forEach(c=>{
  const o=document.createElement('option');
  o.value=c; o.textContent=c;
  companySelect.appendChild(o);
});

let state;
const rnd=(a,b)=>Math.random()*(b-a)+a;
const dist2=(ax,ay,bx,by)=>{const dx=ax-bx,dy=ay-by;return dx*dx+dy*dy;};
function wrap(o){
  if (o.x < 0) o.x += canvas.width;
  if (o.x > canvas.width) o.x -= canvas.width;
  if (o.y < 0) o.y += canvas.height;
  if (o.y > canvas.height) o.y -= canvas.height;
}
function pickTarget(){
  const r = Math.random();
  if (r < 0.55) return { type:"company", label: COMPANIES[Math.floor(Math.random()*COMPANIES.length)] };
  if (r < 0.82) return { type:"debris", label: DEBRIS[Math.floor(Math.random()*DEBRIS.length)] };
  return { type:"natural", label: NATURAL[Math.floor(Math.random()*NATURAL.length)] };
}
function spawn(n){
  state.targets.length=0;
  for (let i=0;i<n;i++){
    const t = pickTarget();
    state.targets.push({
      ...t,
      x:rnd(0,canvas.width), y:rnd(0,canvas.height),
      vx:rnd(-1.2,1.2)*devicePixelRatio,
      vy:rnd(-1.2,1.2)*devicePixelRatio,
      r:rnd(18,46)*devicePixelRatio
    });
  }
}
function reset(){
  state = {
    running:false, score:0, keys:{},
    player:{ label: companySelect.value, x:canvas.width/2, y:canvas.height/2, vx:0, vy:0, ang:-Math.PI/2, r:14*devicePixelRatio },
    bullets:[], targets:[]
  };
  spawn(10);
  hud.textContent = `SCORE: ${state.score}`;
}
function shoot(){
  const p=state.player, sp=7*devicePixelRatio;
  state.bullets.push({
    x:p.x+Math.cos(p.ang)*p.r, y:p.y+Math.sin(p.ang)*p.r,
    vx:Math.cos(p.ang)*sp+p.vx, vy:Math.sin(p.ang)*sp+p.vy,
    life:60
  });
}
function bg(){
  ctx.fillStyle='rgba(5,6,10,0.30)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='rgba(215,247,255,0.10)';
  for(let i=0;i<50;i++) ctx.fillRect((i*97)%canvas.width,(i*53)%canvas.height,1*devicePixelRatio,1*devicePixelRatio);
}
function drawPlayer(){
  const p=state.player;
  ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.ang);
  ctx.strokeStyle='rgba(25,247,255,0.9)'; ctx.lineWidth=2*devicePixelRatio;
  ctx.beginPath();
  ctx.moveTo(18*devicePixelRatio,0);
  ctx.lineTo(-12*devicePixelRatio,10*devicePixelRatio);
  ctx.lineTo(-8*devicePixelRatio,0);
  ctx.lineTo(-12*devicePixelRatio,-10*devicePixelRatio);
  ctx.closePath(); ctx.stroke();
  ctx.fillStyle='rgba(255,204,102,0.9)';
  ctx.font=`${12*devicePixelRatio}px ui-monospace`; ctx.textAlign='center';
  ctx.fillText(p.label,0,-18*devicePixelRatio);
  ctx.restore();
}
function colorFor(t){
  if(t.type==="company") return 'rgba(255,43,214,0.75)';
  if(t.type==="debris") return 'rgba(255,204,102,0.65)';
  return 'rgba(70,255,122,0.65)';
}
function drawTarget(t){
  ctx.strokeStyle=colorFor(t); ctx.lineWidth=2*devicePixelRatio;
  ctx.beginPath(); ctx.arc(t.x,t.y,t.r,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle='rgba(215,247,255,0.9)';
  ctx.font=`${11*devicePixelRatio}px ui-monospace`; ctx.textAlign='center';
  ctx.fillText(t.label,t.x,t.y+4*devicePixelRatio);
}
function tick(){
  if(!state.running) return;
  const p=state.player, k=state.keys;
  const turn=0.06, thrust=0.14*devicePixelRatio;
  if(k.ArrowLeft||k.a) p.ang-=turn;
  if(k.ArrowRight||k.d) p.ang+=turn;
  if(k.ArrowUp||k.w){ p.vx+=Math.cos(p.ang)*thrust; p.vy+=Math.sin(p.ang)*thrust; }
  p.vx*=0.995; p.vy*=0.995;
  p.x+=p.vx; p.y+=p.vy; wrap(p);

  state.bullets.forEach(b=>{ b.x+=b.vx; b.y+=b.vy; b.life--; wrap(b); });
  state.bullets=state.bullets.filter(b=>b.life>0);

  state.targets.forEach(t=>{ t.x+=t.vx; t.y+=t.vy; wrap(t); });

  for(let i=state.targets.length-1;i>=0;i--){
    const t=state.targets[i];
    for(let j=state.bullets.length-1;j>=0;j--){
      const b=state.bullets[j];
      if(dist2(t.x,t.y,b.x,b.y) < t.r*t.r){
        state.targets.splice(i,1); state.bullets.splice(j,1);
        state.score += (t.type==="company"?120:t.type==="debris"?80:100);
        hud.textContent = `SCORE: ${state.score}`;
        break;
      }
    }
  }

  for(const t of state.targets){
    const rr=t.r+p.r;
    if(dist2(t.x,t.y,p.x,p.y) < rr*rr){
      state.running=false;
      hud.textContent = `GAME OVER — SCORE: ${state.score} (R to restart)`;
      break;
    }
  }

  if(state.targets.length===0) spawn(12);

  bg();
  ctx.fillStyle='rgba(70,255,122,0.95)';
  for(const b of state.bullets){ ctx.beginPath(); ctx.arc(b.x,b.y,2.2*devicePixelRatio,0,Math.PI*2); ctx.fill(); }
  state.targets.forEach(drawTarget);
  drawPlayer();
  requestAnimationFrame(tick);
}

window.addEventListener('keydown',(e)=>{
  if(!state) return;
  const key = e.key.length===1 ? e.key.toLowerCase() : e.key;
  state.keys[key]=true;
  if(e.code==='Space'){ e.preventDefault(); if(state.running) shoot(); }
  if(key==='r'){ reset(); state.running=true; requestAnimationFrame(tick); }
});
window.addEventListener('keyup',(e)=>{
  if(!state) return;
  const key = e.key.length===1 ? e.key.toLowerCase() : e.key;
  state.keys[key]=false;
});
startBtn.addEventListener('click',()=>{ reset(); state.running=true; requestAnimationFrame(tick); });

resize(); reset();