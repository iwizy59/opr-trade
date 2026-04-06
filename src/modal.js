import { state } from './state.js';

const FORM_GROUPS = ['h4', 'h1', 'jour', 'pb', 'opr', 'res'];

export function selectOpt(btn) {
  const group = btn.dataset.group;
  state.selections[group] = btn.dataset.val;
  document.querySelectorAll(`.opt-btn[data-group="${group}"]`).forEach(b => {
    const ac = b.style.getPropertyValue('--ac');
    const bg = b.style.getPropertyValue('--bg');
    if (b === btn) {
      b.style.background = bg;
      b.style.color = ac;
      b.style.borderColor = ac;
    } else {
      b.style.background = '#111';
      b.style.color = '#444';
      b.style.borderColor = '#222';
    }
  });
}

export function clearSelections() {
  FORM_GROUPS.forEach(g => {
    delete state.selections[g];
    document.querySelectorAll(`.opt-btn[data-group="${g}"]`).forEach(b => {
      b.style.background = '#111';
      b.style.color = '#444';
      b.style.borderColor = '#222';
    });
  });
}

export function openModal(id = null) {
  state.editId = id;
  clearSelections();
  document.getElementById('f-date').value = '';
  document.getElementById('f-max').value = '';
  document.getElementById('f-r').value = '';
  document.getElementById('f-notes').value = '';
  document.getElementById('f-id').value = '';

  if (id !== null) {
    const t = state.trades.find(x => x.id === id);
    if (t) {
      document.getElementById('modal-title').textContent = `TRADE #${String(id).padStart(2, '0')}`;
      document.getElementById('f-date').value = t.date || '';
      document.getElementById('f-max').value = t.maxAtteint || '';
      document.getElementById('f-r').value = t.rGagne || '';
      document.getElementById('f-notes').value = t.notes || '';
      if (t.alignH4) selectOpt(document.querySelector(`.opt-btn[data-group="h4"][data-val="${t.alignH4}"]`));
      if (t.alignH1) selectOpt(document.querySelector(`.opt-btn[data-group="h1"][data-val="${t.alignH1}"]`));
      if (t.typeJour) selectOpt(document.querySelector(`.opt-btn[data-group="jour"][data-val="${t.typeJour}"]`));
      if (t.pullbackM5) selectOpt(document.querySelector(`.opt-btn[data-group="pb"][data-val="${t.pullbackM5}"]`));
      if (t.pullbackDansOPR) selectOpt(document.querySelector(`.opt-btn[data-group="opr"][data-val="${t.pullbackDansOPR}"]`));
      if (t.resultat) selectOpt(document.querySelector(`.opt-btn[data-group="res"][data-val="${t.resultat}"]`));
    }
  } else {
    document.getElementById('modal-title').textContent = 'NOUVEAU TRADE';
    document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
  }

  document.getElementById('overlay').style.display = 'flex';
}

export function closeModal() {
  document.getElementById('overlay').style.display = 'none';
}

export function handleOverlayClick(e) {
  if (e.target === document.getElementById('overlay')) closeModal();
}

export function getFormData() {
  return {
    date: document.getElementById('f-date').value || null,
    align_h4: state.selections['h4'] || null,
    align_h1: state.selections['h1'] || null,
    type_jour: state.selections['jour'] || null,
    pullback_m5: state.selections['pb'] || null,
    pullback_dans_opr: state.selections['opr'] || null,
    max_atteint: document.getElementById('f-max').value || null,
    resultat: state.selections['res'] || null,
    r_gagne: document.getElementById('f-r').value || null,
    notes: document.getElementById('f-notes').value || null,
  };
}

export function openNewStrategyModal(count) {
  document.getElementById('f-strategy-name').value = `Stratégie ${(count || 0) + 1}`;
  document.getElementById('overlay-strategy').style.display = 'flex';
}

export function closeStrategyModal() {
  document.getElementById('overlay-strategy').style.display = 'none';
}
