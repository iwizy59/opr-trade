import { state } from './state.js';
import * as api from './api.js';
import { getUser } from './auth.js';
import { render, renderHistory, showToast, updateStrategyName } from './render.js';
import { closeModal, getFormData, openNewStrategyModal as _openNewStrategyModal, closeStrategyModal } from './modal.js';

export async function load() {
  const user = await getUser();
  const { strategy, error: stratErr } = await api.ensureActiveStrategy(user.id);
  if (stratErr) { showToast('⚠ Erreur de création de stratégie'); return; }
  state.currentStrategy = strategy;
  updateStrategyName(state.currentStrategy);

  const { data, error } = await api.fetchTrades(strategy.id);
  if (error) { showToast('⚠ Erreur de chargement'); return; }
  state.trades = (data || []).map(api.mapTrade);
  state.displayTrades = state.trades;
  state.displayReadOnly = false;
  render(state.displayTrades, state.displayReadOnly);
}

export async function saveTrade() {
  const user = await getUser();
  const tradeData = getFormData();
  let error;

  if (state.editId !== null) {
    ({ error } = await api.updateTrade(state.editId, user.id, tradeData));
    if (!error) showToast('✓ Trade modifié');
  } else {
    const newId = state.trades.length ? Math.max(...state.trades.map(t => t.id)) + 1 : 1;
    ({ error } = await api.insertTrade({ ...tradeData, trade_id: newId, user_id: user.id, strategy_id: state.currentStrategy.id }));
    if (!error) showToast('✓ Trade enregistré');
  }

  if (error) { showToast('⚠ Erreur de sauvegarde'); return; }
  closeModal();
  await load();
}

export async function deleteTrade(id) {
  if (!confirm('Supprimer ce trade ?')) return;
  const user = await getUser();
  const { error } = await api.removeTrade(id, user.id);
  if (error) { showToast('⚠ Erreur'); return; }
  showToast('Trade supprimé');
  await load();
}

export function exportData() {
  if (state.trades.length === 0) { showToast('⚠ Aucun trade à exporter'); return; }
  const json = JSON.stringify({ version: 1, exportDate: new Date().toISOString(), trades: state.trades }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `opr-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✓ Sauvegarde exportée');
}

export async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const imported = data.trades || data;
      if (!Array.isArray(imported)) throw new Error('Format invalide');
      if (!confirm(`Importer ${imported.length} trades ? Les données actuelles seront remplacées.`)) return;

      const user = await getUser();
      const rows = imported.map(t => ({
        user_id: user.id,
        strategy_id: state.currentStrategy.id,
        trade_id: t.id,
        date: t.date || null,
        align_h4: t.alignH4 || null,
        align_h1: t.alignH1 || null,
        type_jour: t.typeJour || null,
        pullback_m5: t.pullbackM5 || null,
        pullback_dans_opr: t.pullbackDansOPR || null,
        max_atteint: t.maxAtteint || null,
        resultat: t.resultat || null,
        r_gagne: t.rGagne || null,
        notes: t.notes || null,
      }));

      const { error } = await api.replaceTrades(user.id, state.currentStrategy.id, rows);
      if (error) throw error;
      await load();
      showToast(`✓ ${imported.length} trades restaurés`);
    } catch {
      showToast('⚠ Fichier invalide');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

export async function switchTab(tab) {
  state.viewTab = tab;
  document.getElementById('tab-active').classList.toggle('active', tab === 'active');
  document.getElementById('tab-history').classList.toggle('active', tab === 'history');
  const show = id => { document.getElementById(id).style.display = ''; };
  const hide = id => { document.getElementById(id).style.display = 'none'; };

  if (tab === 'active') {
    show('active-view'); hide('history-view');
    show('btn-new-trade'); show('btn-new-strategy'); show('btn-export'); show('btn-import');
    hide('history-detail-header');
    state.displayTrades = state.trades;
    state.displayReadOnly = false;
    render(state.displayTrades, state.displayReadOnly);
  } else {
    hide('active-view'); show('history-view');
    hide('btn-new-trade'); hide('btn-new-strategy'); hide('btn-export'); hide('btn-import');
    await loadHistory();
  }
}

export async function loadHistory() {
  const user = await getUser();
  const { data: strategies } = await api.fetchHistoryStrategies(user.id);
  if (!strategies || strategies.length === 0) {
    state.historyStrategies = [];
    renderHistory(state.historyStrategies, state.historyFilterWinrate);
    return;
  }
  const { data: allTrades } = await api.fetchTradesByStrategyIds(strategies.map(s => s.id));
  state.historyStrategies = strategies.map(s => {
    const ts = (allTrades || []).filter(t => t.strategy_id === s.id).map(api.mapTrade);
    const n = ts.length;
    const tps = ts.filter(t => t.resultat === 'TP').length;
    const totalR = ts.reduce((a, t) => a + (parseFloat(t.rGagne) || 0), 0);
    const wr = n ? Math.round(tps / n * 100) : 0;
    return { strategy: s, trades: ts, n, tps, totalR, wr };
  });
  renderHistory(state.historyStrategies, state.historyFilterWinrate);
}

export async function restoreStrategy(strategyId) {
  if (!confirm('Restaurer cette stratégie comme stratégie active ? La stratégie actuelle sera archivée.')) return;
  if (state.currentStrategy) {
    const { error } = await api.archiveStrategy(state.currentStrategy.id);
    if (error) { showToast('⚠ Erreur lors de l\'archivage'); return; }
  }
  const { error } = await api.unarchiveStrategy(strategyId);
  if (error) { showToast('⚠ Erreur lors de la restauration'); return; }
  showToast('✓ Stratégie restaurée');
  await load();
  switchTab('active');
}

export function toggleHistoryFilter() {
  state.historyFilterWinrate = !state.historyFilterWinrate;
  renderHistory(state.historyStrategies, state.historyFilterWinrate);
}

export function viewHistoryStrategy(strategyId) {
  const entry = state.historyStrategies.find(h => h.strategy.id === strategyId);
  if (!entry) return;
  state.displayTrades = entry.trades;
  state.displayReadOnly = true;
  document.getElementById('history-detail-name').textContent = entry.strategy.name;
  document.getElementById('history-detail-header').style.display = '';
  document.getElementById('active-view').style.display = '';
  document.getElementById('history-view').style.display = 'none';
  render(state.displayTrades, state.displayReadOnly);
}

export function backToHistory() {
  document.getElementById('history-detail-header').style.display = 'none';
  document.getElementById('active-view').style.display = 'none';
  document.getElementById('history-view').style.display = '';
}

export async function deleteArchivedStrategy(strategyId) {
  if (!confirm('Supprimer définitivement cette stratégie et tous ses trades ?')) return;
  const user = await getUser();
  await api.removeStrategyTrades(strategyId, user.id);
  const { error } = await api.removeStrategy(strategyId, user.id);
  if (error) { showToast('⚠ Erreur de suppression'); return; }
  showToast('Stratégie supprimée');
  await loadHistory();
}

export async function openNewStrategyModal() {
  const user = await getUser();
  const { count } = await api.countStrategies(user.id);
  _openNewStrategyModal(count);
}

export async function confirmNewStrategy() {
  const name = document.getElementById('f-strategy-name').value.trim();
  if (!name) { showToast('⚠ Donne un nom à la stratégie'); return; }
  const user = await getUser();
  if (state.currentStrategy) {
    const { error } = await api.archiveStrategy(state.currentStrategy.id);
    if (error) { showToast('⚠ Erreur lors de l\'archivage'); return; }
  }
  const { data: created, error: err2 } = await api.createStrategy(user.id, name);
  if (err2) { showToast('⚠ Erreur de création'); return; }
  state.currentStrategy = created;
  state.trades = [];
  state.displayTrades = [];
  state.displayReadOnly = false;
  closeStrategyModal();
  updateStrategyName(state.currentStrategy);
  render(state.displayTrades, state.displayReadOnly);
  showToast('✓ Nouvelle stratégie démarrée');
}
