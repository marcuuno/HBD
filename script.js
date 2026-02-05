// FX canvas (hearts/confetti)
const fx = document.getElementById("fx");
const ctx = fx.getContext("2d");
let W=0,H=0;

function resize(){
  fx.width  = innerWidth * devicePixelRatio;
  fx.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
addEventListener("resize", resize);
resize();

const particles=[];
function rand(a,b){ return a + Math.random()*(b-a); }

function spawnHeart(x,y,burst=1){
  for(let i=0;i<burst;i++){
    particles.push({type:"heart",x,y,vx:rand(-1.2,1.2),vy:rand(-2.6,-1.1),r:rand(10,22),rot:rand(0,6.28),vr:rand(-0.06,0.06),t:0,life:rand(90,160)});
  }
}
function spawnConfetti(x,y,count=120){
  for(let i=0;i<count;i++){
    particles.push({type:"confetti",x,y,vx:rand(-4.2,4.2),vy:rand(-8.5,-2.0),g:rand(0.12,0.22),w:rand(5,10),h:rand(8,14),rot:rand(0,6.28),vr:rand(-0.25,0.25),t:0,life:rand(120,220)});
  }
}

function drawHeart(x,y,s,rot){
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.scale(s/18,s/18);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-12, -6, -16, 8, 0, 18);
  ctx.bezierCurveTo(16, 8, 12, -6, 0, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

(function loop(){
  ctx.clearRect(0,0,innerWidth,innerHeight);
  if(Math.random()<0.08) spawnHeart(rand(40,innerWidth-40), innerHeight+30, 1);

  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.t++;

    if(p.type==="heart"){
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.01;
      const a = 1 - p.t/p.life;
      ctx.globalAlpha = Math.max(0,a);
      ctx.fillStyle = "rgba(255,79,216,.95)";
      drawHeart(p.x,p.y,p.r,p.rot);
    } else {
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.rot += p.vr;
      const a = 1 - p.t/p.life;
      ctx.globalAlpha = Math.max(0,a);
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rot);
      const hue = (p.x * 0.2 + p.y * 0.12 + p.t * 3) % 360;
      ctx.fillStyle = `hsla(${hue}, 95%, 65%, ${Math.max(0,a)})`;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    }

    if(p.t > p.life) particles.splice(i,1);
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(loop);
})();

// Page-specific controls (only if buttons exist)
const yesBtn = document.getElementById("yesBtn");
const noBtn  = document.getElementById("noBtn");
const arena  = document.getElementById("arena");

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

function dodgeFrom(px, py){
  if(!arena || !noBtn) return;

  const a = arena.getBoundingClientRect();
  const b = noBtn.getBoundingClientRect();

  const curX = (b.left - a.left) + b.width/2;
  const curY = (b.top  - a.top ) + b.height/2;

  const dx = curX - (px - a.left);
  const dy = curY - (py - a.top);
  const dist = Math.max(18, Math.hypot(dx,dy));

  const strength = clamp(240 / dist, 1.6, 7.0);

  let nx = curX + (dx/dist) * 26 * strength + rand(-10,10);
  let ny = curY + (dy/dist) * 20 * strength + rand(-10,10);

  const pad = 12;
  nx = clamp(nx, pad + b.width/2, a.width - pad - b.width/2);
  ny = clamp(ny, pad + b.height/2, a.height - pad - b.height/2);

  noBtn.style.left = `${nx}px`;
  noBtn.style.top  = `${ny}px`;
  noBtn.style.transform = `translate(-50%, -50%)`;
}

if(noBtn && arena){
  // Desktop: dodge when mouse gets close
  arena.addEventListener("mousemove", (e) => {
    const r = noBtn.getBoundingClientRect();
    const cx = r.left + r.width/2;
    const cy = r.top  + r.height/2;
    if(Math.hypot(e.clientX-cx, e.clientY-cy) < 170) dodgeFrom(e.clientX, e.clientY);
  });

  // ✅ Mobile: dodge when they TRY to press it (impossible to click)
  noBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dodgeFrom(e.clientX, e.clientY);
  });

  noBtn.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    dodgeFrom(t.clientX, t.clientY);
  }, {passive:true});

  // Also dodge on hover
  noBtn.addEventListener("mouseenter", (e) => dodgeFrom(e.clientX, e.clientY));

  // Initial position inside the arena
  setTimeout(() => {
    const a = arena.getBoundingClientRect();
    noBtn.style.left = `${a.width * 0.72}px`;
    noBtn.style.top  = `${a.height * 0.55}px`;
  }, 50);
}

if(yesBtn){
  yesBtn.addEventListener("pointerdown", () => {
    const r = yesBtn.getBoundingClientRect();
    const x = r.left + r.width/2;
    const y = r.top  + r.height/2;

    spawnConfetti(x, y, 180);
    spawnHeart(x, y, 18);

    setTimeout(() => {
      window.location.href = "success.html";
    }, 450);
  });
}
