import { BADGE, MAX_TRADES } from './config.js';
import { renderChart } from './chart.js';

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function badge(val) {
  if (!val) return '';
  const cfg = BADGE[val] || ['#222', '#666', escapeHtml(val)];
  return `<span class="badge" style="background:${cfg[0]};color:${cfg[1]}">${cfg[2]}</span>`;
}

export function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

export function updateStrategyName(strategy) {
  if (strategy) document.getElementById('header-strategy-name').textContent = strategy.name;
}

export function render(displayTrades, displayReadOnly) {
  const n = displayTrades.length;
  const tps = displayTrades.filter(t => t.resultat === 'TP').length;
  const sls = displayTrades.filter(t => t.resultat === 'SL').length;
  const invs = displayTrades.filter(t => t.resultat === 'Invalidation').length;
  const wr = n ? Math.round(tps / n * 100) : 0;
  const totalR = displayTrades.reduce((a, t) => a + (parseFloat(t.rGagne) || 0), 0);
  const maxTrades = displayTrades.filter(t => t.maxAtteint !== '');
  const avgMax = maxTrades.length
    ? (maxTrades.reduce((a, t) => a + (parseFloat(t.maxAtteint) || 0), 0) / maxTrades.length).toFixed(2)
    : null;
  const aligned = displayTrades.filter(t => t.alignH4 && t.alignH1 && t.alignH4 === t.alignH1).length;
  const pct = Math.min(n / MAX_TRADES * 100, 100);

  document.getElementById('prog-text').textContent = `${n} / ${MAX_TRADES} trades`;
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('s-n').textContent = n;
  document.getElementById('s-rest').textContent = `${Math.max(MAX_TRADES - n, 0)} restants`;

  const wrEl = document.getElementById('s-wr');
  wrEl.textContent = wr + '%';
  wrEl.style.color = wr >= 34 ? '#00e676' : '#ff5252';

  const rEl = document.getElementById('s-r');
  rEl.textContent = (totalR >= 0 ? '+' : '') + totalR.toFixed(1) + 'R';
  rEl.style.color = totalR >= 0 ? '#00e676' : '#ff5252';

  document.getElementById('s-tsl').textContent = `${tps}/${sls}/${invs}`;
  document.getElementById('s-max').textContent = avgMax ? avgMax + 'R' : '—';
  document.getElementById('s-align').textContent = n ? `${Math.round(aligned / n * 100)}%` : '—';

  renderChart(displayTrades);

  const container = document.getElementById('trade-container');
  if (displayTrades.length === 0) {
    container.innerHTML = `<div class="empty"><div class="empty-icon">📊</div><div class="empty-title">Aucun trade enregistré</div><div class="empty-sub">${displayReadOnly ? 'Cette stratégie ne contient aucun trade.' : 'Appuyez sur "+ Trade" pour commencer'}</div></div>`;
    return;
  }

  container.innerHTML = `<div class="trade-list">${[...displayTrades].reverse().map(t => {
    const r = parseFloat(t.rGagne);
    const rColor = r > 0 ? '#00e676' : r < 0 ? '#ff5252' : '#555';
    const rText = t.rGagne !== '' ? `${r > 0 ? '+' : ''}${t.rGagne}R` : '—';
    return `
    <div class="trade-card">
      <div class="trade-card-top">
        <span class="trade-num">#${String(t.id).padStart(2, '0')} ${t.date ? '· ' + escapeHtml(t.date) : ''}</span>
        ${!displayReadOnly ? `<div class="trade-actions">
          <button class="btn-edit" onclick="openModal(${t.id})">Éditer</button>
          <button class="btn-del" onclick="deleteTrade(${t.id})">✕</button>
        </div>` : ''}
      </div>
      <div class="trade-badges">
        ${badge(t.alignH4)}${badge(t.alignH1)}${badge(t.typeJour)}${badge(t.pullbackM5)}${badge(t.pullbackDansOPR)}${badge(t.resultat)}
      </div>
      <div class="trade-bottom">
        <span class="trade-max">${t.maxAtteint ? 'Max: ' + t.maxAtteint + 'R' : ''}</span>
        <span class="trade-r" style="color:${rColor}">${rText}</span>
      </div>
      ${t.notes ? `<div class="trade-notes">${escapeHtml(t.notes)}</div>` : ''}
    </div>`;
  }).join('')}</div>`;
}

export function renderHistory(historyStrategies, historyFilterWinrate) {
  const view = document.getElementById('history-view');
  if (historyStrategies.length === 0) {
    view.innerHTML = `<div class="empty"><div class="empty-icon">📂</div><div class="empty-title">Aucune stratégie archivée</div><div class="empty-sub">Démarre une nouvelle stratégie pour archiver l'actuelle</div></div>`;
    return;
  }
  const filtered = historyFilterWinrate ? historyStrategies.filter(h => h.wr >= 34) : historyStrategies;
  const filterBtn = `<button onclick="toggleHistoryFilter()" style="background:none;border:1px solid ${historyFilterWinrate ? '#00e676' : '#222'};border-radius:6px;color:${historyFilterWinrate ? '#00e676' : '#444'};font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:6px 12px;cursor:pointer;font-family:'Inter',sans-serif;margin-bottom:14px;">Winrate ≥ 34%</button>`;
  if (filtered.length === 0) {
    view.innerHTML = filterBtn + `<div class="empty"><div class="empty-icon">📊</div><div class="empty-title">Aucune stratégie</div><div class="empty-sub">Aucune stratégie archivée n'atteint cet objectif</div></div>`;
    return;
  }
  view.innerHTML = filterBtn + `<div class="history-list">${filtered.map(({ strategy: s, n, totalR, wr }) => {
    const rColor = totalR >= 0 ? '#00e676' : '#ff5252';
    const rText = (totalR >= 0 ? '+' : '') + totalR.toFixed(1) + 'R';
    const date = s.archived_at ? new Date(s.archived_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    return `<div class="history-card" onclick="viewHistoryStrategy('${s.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
        <div class="history-card-name">${escapeHtml(s.name)}</div>
        <button onclick="event.stopPropagation();deleteArchivedStrategy('${s.id}')" style="background:none;border:1px solid #2e0a0a;border-radius:6px;color:#ff5252;font-size:11px;padding:3px 8px;cursor:pointer;flex-shrink:0;margin-left:8px;">✕</button>
      </div>
      <div class="history-card-meta">Archivée le ${date} · ${n} trade${n > 1 ? 's' : ''}</div>
      <div class="history-stats">
        <div><div class="history-stat-lbl">Trades</div><div class="history-stat-val" style="color:#29b6f6">${n}</div></div>
        <div><div class="history-stat-lbl">Winrate</div><div class="history-stat-val" style="color:${wr >= 34 ? '#00e676' : '#ff5252'}">${wr}%</div></div>
        <div><div class="history-stat-lbl">Total R</div><div class="history-stat-val" style="color:${rColor}">${rText}</div></div>
      </div>
    </div>`;
  }).join('')}</div>`;
}
