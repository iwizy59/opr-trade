export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
export const MAX_TRADES = 50;

export const BADGE = {
  Haussier:    ['#0a2e1a', '#00e676', '▲ Haussier'],
  Baissier:    ['#2e0a0a', '#ff5252', '▼ Baissier'],
  Tendance:    ['#0d1f2d', '#29b6f6', 'Tendance'],
  Range:       ['#1a1500', '#ffd54f', 'Range'],
  Macro:       ['#1a0d2e', '#ce93d8', 'Macro'],
  Propre:      ['#0a2e1a', '#00e676', 'Propre'],
  Forcé:       ['#2e1a0a', '#ff9800', 'Forcé'],
  Oui:         ['#2e0a0a', '#ff5252', 'Dans OPR ⚠'],
  Non:         ['#0a2e1a', '#00e676', 'OPR OK ✓'],
  TP:          ['#0a2e1a', '#00e676', 'TP ✓'],
  SL:          ['#2e0a0a', '#ff5252', 'SL ✗'],
  Invalidation:['#1a1a2e', '#7c83fd', 'Inval.'],
};
