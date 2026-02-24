import { dda } from './lib/dda.js'

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

const CELL = 30;

function toPixel(mx, my) {
  const ox = canvas.width  / 2;
  const oy = canvas.height / 2;
  return { px: ox + mx * CELL, py: oy - my * CELL };
}

function toMath(px, py) {
  const ox = canvas.width  / 2;
  const oy = canvas.height / 2;
  return {
    x: Math.round((px - ox) / CELL),
    y: Math.round((oy - py) / CELL),
  };
}

function drawGrid() {
  if (!showGrid) return;

  const w = canvas.width, h = canvas.height;
  const ox = w / 2, oy = h / 2;

  ctx.strokeStyle = C.grid;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  for (let x = ox % CELL; x < w; x += CELL) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
  for (let y = oy % CELL; y < h; y += CELL) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
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

  const startX = -Math.floor(ox / CELL);
  const endX   =  Math.floor((w - ox) / CELL);
  for (let i = startX; i <= endX; i++) {
    if (i === 0) continue;
    const { px } = toPixel(i, 0);
    ctx.fillText(i, px, oy + 14);
  }

  const startY = -Math.floor((h - oy) / CELL);
  const endY   =  Math.floor(oy / CELL);
  ctx.textAlign = 'right';
  for (let j = startY; j <= endY; j++) {
    if (j === 0) continue;
    const { py } = toPixel(0, j);
    ctx.fillText(j, ox - 6, py + 3);
  }

  ctx.fillStyle = C.origin;
  ctx.textAlign = 'right';
  ctx.fillText('0', ox - 6, oy + 14);
}

function drawPoints(pts, showLabels) {
  pts.forEach(({ px, py, x, y }, i) => {
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

    if (showLabels) {
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
    if (i < pts.length) requestAnimationFrame(step);
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
    if (currentAlgo === 'dda' || currentAlgo === 'bresenham_line') {
      const x1 = +document.getElementById('line_x1').value;
      const y1 = +document.getElementById('line_y1').value;
      const x2 = +document.getElementById('line_x2').value;
      const y2 = +document.getElementById('line_y2').value;

      const raw = currentAlgo === 'dda'
        ? dda(x1, y1, x2, y2)
        : GraphicsLib.bresenhamLine(x1, y1, x2, y2);

      points = raw.map(([x, y]) => ({ x, y, ...toPixel(x, y) }));

    } else {
      const cx = +document.getElementById('circ_cx').value;
      const cy = +document.getElementById('circ_cy').value;
      const r  = +document.getElementById('circ_r').value;

      const raw = currentAlgo === 'midpoint_circle'
        ? GraphicsLib.midpointCircle(cx, cy, r)
        : GraphicsLib.bresenhamCircle(cx, cy, r);

      points = raw.map(([x, y]) => ({ x, y, ...toPixel(x, y) }));
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

  if (animate) {
    animateDraw(points);
  } else {
    render(points);
    setStatus('Done');
    canvasInfo.textContent = `${points.length} points plotted`;
  }
});

document.querySelectorAll('.algo-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentAlgo = btn.dataset.algo;

    const isCircle = currentAlgo.includes('circle');
    document.getElementById('inputs-line').classList.toggle('active', !isCircle);
    document.getElementById('inputs-circle').classList.toggle('active',  isCircle);
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
  const link = document.createElement('a');
  link.download = 'graphicslab-output.png';
  link.href = canvas.toDataURL();
  link.click();
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx   = e.clientX - rect.left;
  const my   = e.clientY - rect.top;
  const math = toMath(mx, my);

  coordDsp.textContent = `x: ${math.x} &nbsp; y: ${math.y}`;

  let closest = null, minD = 14;
  plottedPoints.forEach(pt => {
    const d = Math.hypot(pt.px - mx, pt.py - my);
    if (d < minD) { minD = d; closest = pt; }
  });

  if (closest) {
    tooltip.style.left = (closest.px + 14) + 'px';
    tooltip.style.top  = (closest.py - 20) + 'px';
    document.getElementById('tooltipText').textContent = `(${closest.x}, ${closest.y})`;
    tooltip.classList.add('visible');
  } else {
    tooltip.classList.remove('visible');
  }
});

canvas.addEventListener('mouseleave', () => {
  tooltip.classList.remove('visible');
  coordDsp.textContent = 'x: — &nbsp; y: —';
});

window.addEventListener('load', () => {
  resize();
});