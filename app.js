import { dda } from './lib/dda.js'
import { bresenham } from './lib/bresenham.js';
import { midpointCircle } from './lib/midpointCircle.js';
import { midpointEllipse } from './lib/midpointEllipse.js';

const canvas   = document.getElementById('graphCanvas');
const ctx      = canvas.getContext('2d');
const tooltip  = document.getElementById('pointTooltip');
const log      = document.getElementById('pointLog');
const statusTx = document.getElementById('statusText');
const coordDsp = document.getElementById('coordDisplay');
const canvasInfo = document.getElementById('canvasInfo');

let currentAlgo = 'dda';
let plottedPoints = [];  
let showGrid = true;

const C = {
  bg:       '#0f1117',
  grid:     'rgba(0,229,255,0.06)',
  axis:     'rgba(0,229,255,0.25)',
  point:    '#00e5ff',
  pointGlow:'rgba(0,229,255,0.35)',
  label:    'rgba(0,229,255,0.7)',
  origin:   'rgba(57,255,159,0.8)',
};

function resize() {
  const wrap = canvas.parentElement;
  canvas.width  = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  render();
}

window.addEventListener('resize', resize);

let scale = 30;          
let offsetX = 0;         
let offsetY = 0;         

let isDragging = false;
let lastMouse = { x: 0, y: 0 };

function toPixel(mx, my) {
  const ox = canvas.width / 2 + offsetX;
  const oy = canvas.height / 2 + offsetY;
  return {
    px: ox + mx * scale,
    py: oy - my * scale
  };
}

function toMath(px, py) {
  const ox = canvas.width / 2 + offsetX;
  const oy = canvas.height / 2 + offsetY;
  return {
    x: Math.round((px - ox) / scale),
    y: Math.round((oy - py) / scale),
  };
}

function drawGrid() {
  if(!showGrid) return;
  const w = canvas.width, h = canvas.height;
  const ox = canvas.width / 2 + offsetX;
  const oy = canvas.height / 2 + offsetY;
  ctx.strokeStyle = C.grid;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  for(let x = ((ox % scale) + scale) % scale; x < w; x += scale) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
  for(let y = ((oy % scale) + scale) % scale; y < h; y += scale) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
  ctx.stroke();
  ctx.strokeStyle = C.axis;
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(ox, 0); ctx.lineTo(ox, h);
  ctx.moveTo(0, oy); ctx.lineTo(w, oy);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(0,229,255,0.3)';
  ctx.font = '9px Space Mono, monospace';
  ctx.textAlign = 'center';
  const startX = -Math.floor(ox / scale);
  const endX   =  Math.floor((w - ox) / scale);
  for(let i = startX; i <= endX; i++) {
    if(i === 0) continue;
    const { px } = toPixel(i, 0);
    ctx.fillText(i, px, oy + 14);
  }
  const startY = -Math.floor((h - oy) / scale);
  const endY   =  Math.floor(oy / scale);
  ctx.textAlign = 'right';
  for(let j = startY; j <= endY; j++) {
    if(j === 0) continue;
    const { py } = toPixel(0, j);
    ctx.fillText(j, ox - 6, py + 3);
  }
  ctx.fillStyle = C.origin;
  ctx.textAlign = 'right';
  ctx.fillText('0', ox - 6, oy + 14);
}

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = 1.1;
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;
  const before = toMath(mouseX, mouseY);
  if (e.deltaY < 0) scale *= zoomFactor;
  else scale /= zoomFactor;
  scale = Math.max(5, Math.min(scale, 200)); 
  const after = toMath(mouseX, mouseY);
  offsetX += (after.x - before.x) * scale;
  offsetY -= (after.y - before.y) * scale;
  render();
});

canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  lastMouse = { x: e.clientX, y: e.clientY };
  canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mouseup', () => { isDragging = false; canvas.style.cursor = 'crosshair'; });
canvas.addEventListener('mouseleave', () => {
  isDragging = false;
  canvas.style.cursor = 'crosshair';
  tooltip.classList.remove('visible');
  coordDsp.textContent = 'x: — &nbsp; y: —';
});

document.getElementById('resetViewBtn').addEventListener('click', () => {
  scale = 30;
  offsetX = 0;
  offsetY = 0;
  render();
});

function drawPoints(pts, showLabels) {
  pts.forEach(({ x, y }, i) => {
    const { px, py } = toPixel(x, y);
    const grad = ctx.createRadialGradient(px, py, 0, px, py, 8);
    grad.addColorStop(0, C.pointGlow);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = C.point;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

    if(showLabels) {
      ctx.fillStyle = C.label;
      ctx.font = '9px Space Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`(${x},${y})`, px + 6, py - 4);
    }
  });
}

function render(pts = plottedPoints) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  const showLabels = document.getElementById('showLabels').checked;
  drawPoints(pts, showLabels);
}

function animateDraw(pts) {
  let i = 0;
  const step = () => {
    render(pts.slice(0, i + 1));
    i++;
    if(i < pts.length) requestAnimationFrame(step);
    else {
      setStatus('Done', true);
      canvasInfo.textContent = `${pts.length} points plotted`;
    }
  };
  requestAnimationFrame(step);
}

function setStatus(msg, done = false) {
  statusTx.textContent = msg;
}

document.getElementById('runBtn').addEventListener('click', () => {
  const animate = document.getElementById('animateDraw').checked;
  let points = [];

  try {
    if(currentAlgo === 'dda' || currentAlgo === 'bresenham_line') {
      const x1 = +document.getElementById('line_x1').value;
      const y1 = +document.getElementById('line_y1').value;
      const x2 = +document.getElementById('line_x2').value;
      const y2 = +document.getElementById('line_y2').value;
      const raw = currentAlgo === 'dda' ? dda(x1, y1, x2, y2) : bresenham(x1, y1, x2, y2);
      points = raw.map(([x, y]) => ({ x, y }));
    } 
    else if(currentAlgo === 'midpoint_circle') {
      const cx = +document.getElementById('circ_cx').value;
      const cy = +document.getElementById('circ_cy').value;
      const r  = +document.getElementById('circ_r').value;
      const raw = midpointCircle(r, cx, cy);
      points = raw.map(([x, y]) => ({ x, y }));
    } 
    else if(currentAlgo === 'midpoint_ellipse') {
      const cx = +document.getElementById('ellipse_cx').value;
      const cy = +document.getElementById('ellipse_cy').value;
      const rx = +document.getElementById('ellipse_rx').value;
      const ry = +document.getElementById('ellipse_ry').value;
      const raw = midpointEllipse(rx, ry, cx, cy);
      points = raw.map(([x, y]) => ({ x, y }));
    }
  } catch (e) {
    console.error(e);
    setStatus('Error: ' + e.message);
    return;
  }

  plottedPoints = points;
  setStatus('Running…');

  log.innerHTML = '';
  points.forEach(({ x, y }, i) => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `<span class="log-idx">${String(i + 1).padStart(3, '0')}</span> (${x}, ${y})`;
    log.appendChild(div);
  });
  log.scrollTop = 0;

  if(animate) animateDraw(points);
  else {
    render(points);
    setStatus('Done');
    canvasInfo.textContent = `${points.length} points plotted`;
  }
});

document.querySelectorAll('.algo-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.algo-btn')
      .forEach(b => b.classList.remove('active'));

    btn.classList.add('active');
    currentAlgo = btn.dataset.algo;

    const isCircle = currentAlgo.includes('circle');
    const isEllipse = currentAlgo.includes('ellipse');
    const isLine = !isCircle && !isEllipse;

    document.getElementById('inputs-line').classList.toggle('active', isLine);
    document.getElementById('inputs-circle').classList.toggle('active', isCircle);
    document.getElementById('inputs-ellipse').classList.toggle('active', isEllipse);
  });
});

document.getElementById('clearBtn').addEventListener('click', () => {
  plottedPoints = [];
  log.innerHTML = '<p class="log-empty">No output yet. Run an algorithm to see plotted points.</p>';
  canvasInfo.textContent = 'Awaiting input...';
  setStatus('Ready');
  render([]);
});

document.getElementById('gridToggle').addEventListener('click', () => {
  showGrid = !showGrid;
  render();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  render();
  const link = document.createElement('a');
  link.download = 'graphicslab-output.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const math = toMath(mx, my);
  coordDsp.textContent = `x: ${math.x} &nbsp; y: ${math.y}`;

  if(isDragging) {
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    offsetX += dx;
    offsetY += dy;
    lastMouse = { x: e.clientX, y: e.clientY };
    render();
    tooltip.classList.remove('visible');
    return;
  }

  let closest = null, minD = 14;
  plottedPoints.forEach(pt => {
    const { px, py } = toPixel(pt.x, pt.y);
    const d = Math.hypot(px - mx, py - my);
    if(d < minD) { minD = d; closest = { ...pt, px, py }; }
  });

  if(closest) {
    tooltip.style.left = (closest.px + 14) + 'px';
    tooltip.style.top  = (closest.py - 20) + 'px';
    document.getElementById('tooltipText').textContent = `(${closest.x}, ${closest.y})`;
    tooltip.classList.add('visible');
  } 
  else tooltip.classList.remove('visible');
});

window.addEventListener('load', () => {
  resize();
});