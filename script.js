const yesBtn = document.getElementById("yesBtn");
const noBtn  = document.getElementById("noBtn");
const row    = document.querySelector(".btn-row");

///// --- FX Canvas (hearts + confetti) ---
const fx = document.getElementById("fx");
const ctx = fx.getContext("2d");

let W = 0, H = 0;
function resize(){
  W = fx.width  = window.innerWidth * devicePixelRatio;
  H = fx.height = window.innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
window.addEventListener("resize", resize);
resize();

const particles = [];
function rand(a,b){ return a + Math.random()*(b-a); }

function spawnHeart(x,y,burst=1){
  for(let i=0;i<burst;i++){
    particles.push({
      type:"heart",
      x, y,
      vx: rand(-1.2, 1.2),
      vy: rand(-2.6, -1.1),
      r: rand(10, 22),
      rot: rand(0, Math.PI*2),
      vr: rand(-0.06, 0.06),
      life: rand(90, 150),
      t: 0
    });
  }
}

function spawnConfetti(x,y,count=120){
  for(let i=0;i<count;i++){
    particles.push({
      type:"confetti",
      x, y,
      vx: rand(-4.2, 4.2),
      vy: rand(-8.5, -2.0),
      g: rand(0.12, 0.22),
      w: rand(5, 10),
      h: rand(8, 14),
      rot: rand(0, Math.PI*2),
      vr: rand(-0.25, 0.25),
      life: rand(120, 200),
      t: 0
    });
  }
}

function drawHeart(x,y,s,rot){
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(rot);
  ctx.scale(s/18, s/18);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-12, -6, -16, 8, 0, 18);
  ctx.bezierCurveTo(16, 8, 12, -6, 0, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function tick(){
  ctx.clearRect(0,0,window.innerWidth,window.innerHeight);

  // ambient hearts drifting upward
  if(Math.random() < 0.08){
    spawnHeart(rand(40, window.innerWidth-40), window.innerHeight + 30, 1);
  }

  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.t++;
    if(p.type==="heart"){
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.vy += 0.01; // tiny gravity (still goes up mostly)
      const a = 1 - p.t / p.life;
      ctx.globalAlpha = Math.max(0,a);
      ctx.fillStyle = "rgba(255,79,216,.95)";
      drawHeart(p.x, p.y, p.r, p.rot);
    } else {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.rot += p.vr;
      const a = 1 - p.t / p.life;
      ctx.globalAlpha = Math.max(0,a);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // confetti colors without hardcoding a single palette (still looks luxe)
      const hue = (p.x * 0.15 + p.y * 0.1 + p.t * 3) % 360;
      ctx.fillStyle = `hsla(${hue}, 95%, 65%, ${Math.max(0,a)})`;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    }

    if(p.t > p.life) particles.splice(i,1);
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(tick);
}
tick();

///// --- NO button: “magnetic dodge” (hard to click) ---
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

function moveNoAwayFrom(px, py){
  const rowRect = row.getBoundingClientRect();
  const btnRect = noBtn.getBoundingClientRect();

  // current position in row space
  const curX = btnRect.left - rowRect.left + btnRect.width/2;
  const curY = btnRect.top  - rowRect.top  + btnRect.height/2;

  const dx = curX - (px - rowRect.left);
  const dy = curY - (py - rowRect.top);
  const dist = Math.max(20, Math.hypot(dx,dy));

  // push away stronger when closer
  const strength = clamp(220 / dist, 1.4, 6.0);

  let nx = curX + (dx/dist) * 22 * strength + rand(-6,6);
  let ny = curY + (dy/dist) * 18 * strength + rand(-6,6);

  const pad = 10;
  nx = clamp(nx, pad + btnRect.width/2, rowRect.width - pad - btnRect.width/2);
  ny = clamp(ny, pad + btnRect.height/2, rowRect.height - pad - btnRect.height/2);

  noBtn.style.left = `${nx}px`;
  noBtn.style.top  = `${ny}px`;
  noBtn.style.transform = `translate(-50%, -50%)`; // keep anchor
}

// desktop: dodge when cursor approaches
row.addEventListener("mousemove", (e) => {
  const btnRect = noBtn.getBoundingClientRect();
  const cx = btnRect.left + btnRect.width/2;
  const cy = btnRect.top  + btnRect.height/2;
  const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
  if(dist < 150) moveNoAwayFrom(e.clientX, e.clientY);
});

// mobile: dodge when finger lands near it
row.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  moveNoAwayFrom(t.clientX, t.clientY);
}, {passive:true});

// initial random placement
setTimeout(() => {
  const rowRect = row.getBoundingClientRect();
  noBtn.style.left = `${rowRect.width * 0.75}px`;
  noBtn.style.top  = `${rowRect.height * 0.55}px`;
}, 50);

///// --- YES: confetti + r
