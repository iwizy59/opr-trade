export function renderChart(displayTrades) {
  const sorted = [...displayTrades].sort((a, b) => a.id - b.id);
  const section = document.getElementById('chart-section');

  if (sorted.length < 2) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  let cum = 0;
  const points = [{ x: 0, y: 0 }];
  sorted.forEach((t, i) => {
    cum += parseFloat(t.rGagne) || 0;
    points.push({ x: i + 1, y: parseFloat(cum.toFixed(2)) });
  });

  const currentR = points[points.length - 1].y;
  const el = document.getElementById('chart-current-r');
  el.textContent = (currentR >= 0 ? '+' : '') + currentR + 'R';
  el.style.color = currentR >= 0 ? '#00e676' : '#ff5252';

  const canvas = document.getElementById('equity-chart');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const W = rect.width || canvas.offsetWidth || 300;
  const H = 180;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const pad = { top: 16, right: 16, bottom: 28, left: 40 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  const ys = points.map(p => p.y);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 0);
  const rangeY = maxY - minY || 1;
  const maxX = points.length - 1;

  const toX = x => pad.left + (x / maxX) * cw;
  const toY = y => pad.top + ch - ((y - minY) / rangeY) * ch;

  const zeroY = toY(0);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pad.left, zeroY);
  ctx.lineTo(pad.left + cw, zeroY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#161616';
  ctx.lineWidth = 1;
  [0.25, 0.5, 0.75].forEach(f => {
    const gy = pad.top + ch * f;
    ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(pad.left + cw, gy); ctx.stroke();
  });

  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
  if (currentR >= 0) {
    grad.addColorStop(0, 'rgba(0,230,118,0.25)');
    grad.addColorStop(1, 'rgba(0,230,118,0)');
  } else {
    grad.addColorStop(0, 'rgba(255,82,82,0)');
    grad.addColorStop(1, 'rgba(255,82,82,0.25)');
  }

  ctx.beginPath();
  ctx.moveTo(toX(points[0].x), zeroY);
  points.forEach(p => ctx.lineTo(toX(p.x), toY(p.y)));
  ctx.lineTo(toX(points[points.length - 1].x), zeroY);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = currentR >= 0 ? '#00e676' : '#ff5252';
  ctx.lineJoin = 'round';
  points.forEach((p, i) => i === 0 ? ctx.moveTo(toX(p.x), toY(p.y)) : ctx.lineTo(toX(p.x), toY(p.y)));
  ctx.stroke();

  points.forEach((p, i) => {
    if (i === 0) return;
    const t = sorted[i - 1];
    const dotColor = t.resultat === 'TP' ? '#00e676' : t.resultat === 'SL' ? '#ff5252' : '#7c83fd';
    ctx.beginPath();
    ctx.arc(toX(p.x), toY(p.y), 3.5, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    ctx.fill();
  });

  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(toX(last.x), toY(last.y), 5, 0, Math.PI * 2);
  ctx.fillStyle = currentR >= 0 ? '#00e676' : '#ff5252';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(toX(last.x), toY(last.y), 8, 0, Math.PI * 2);
  ctx.strokeStyle = currentR >= 0 ? 'rgba(0,230,118,0.3)' : 'rgba(255,82,82,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#444';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'right';
  [minY, 0, maxY].forEach(v => {
    const y = toY(v);
    if (y > pad.top + 8 && y < pad.top + ch - 4) {
      ctx.fillText((v >= 0 ? '+' : '') + v.toFixed(1) + 'R', pad.left - 4, y + 4);
    }
  });

  ctx.textAlign = 'center';
  const labelPts = [1, Math.round(maxX / 2), maxX].filter((v, i, a) => a.indexOf(v) === i && v > 0);
  labelPts.forEach(x => ctx.fillText('#' + x, toX(x), H - 6));
}
