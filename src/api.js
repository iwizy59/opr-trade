import { db } from './db.js';

export function mapTrade(t) {
  return {
    id: t.trade_id,
    date: t.date || '',
    alignH4: t.align_h4 || '',
    alignH1: t.align_h1 || '',
    typeJour: t.type_jour || '',
    pullbackM5: t.pullback_m5 || '',
    pullbackDansOPR: t.pullback_dans_opr || '',
    maxAtteint: t.max_atteint != null ? String(t.max_atteint) : '',
    resultat: t.resultat || '',
    rGagne: t.r_gagne != null ? String(t.r_gagne) : '',
    notes: t.notes || '',
  };
}

export async function ensureActiveStrategy(userId) {
  const { data: rows } = await db.from('strategies').select('*')
    .eq('user_id', userId).is('archived_at', null)
    .order('created_at', { ascending: true }).limit(1);

  if (rows && rows.length > 0) return { strategy: rows[0] };

  const { count } = await db.from('strategies')
    .select('*', { count: 'exact', head: true }).eq('user_id', userId);
  const name = `Stratégie ${(count || 0) + 1}`;
  const { data: created, error } = await db.from('strategies')
    .insert({ user_id: userId, name }).select().single();
  if (error) return { strategy: null, error };
  await db.from('trades').update({ strategy_id: created.id })
    .eq('user_id', userId).is('strategy_id', null);
  return { strategy: created };
}

export function fetchTrades(strategyId) {
  return db.from('trades').select('*')
    .eq('strategy_id', strategyId).order('trade_id', { ascending: true });
}

export function insertTrade(tradeData) {
  return db.from('trades').insert(tradeData);
}

export function updateTrade(tradeId, userId, tradeData) {
  return db.from('trades').update(tradeData)
    .eq('trade_id', tradeId).eq('user_id', userId);
}

export function removeTrade(tradeId, userId) {
  return db.from('trades').delete()
    .eq('trade_id', tradeId).eq('user_id', userId);
}

export function fetchHistoryStrategies(userId) {
  return db.from('strategies').select('*')
    .eq('user_id', userId).not('archived_at', 'is', null)
    .order('archived_at', { ascending: false });
}

export function fetchTradesByStrategyIds(strategyIds) {
  return db.from('trades').select('*').in('strategy_id', strategyIds);
}

export function removeStrategy(strategyId, userId) {
  return db.from('strategies').delete()
    .eq('id', strategyId).eq('user_id', userId);
}

export function removeStrategyTrades(strategyId, userId) {
  return db.from('trades').delete()
    .eq('strategy_id', strategyId).eq('user_id', userId);
}

export function createStrategy(userId, name) {
  return db.from('strategies').insert({ user_id: userId, name }).select().single();
}

export function archiveStrategy(strategyId) {
  return db.from('strategies')
    .update({ archived_at: new Date().toISOString() }).eq('id', strategyId);
}

export function countStrategies(userId) {
  return db.from('strategies').select('*', { count: 'exact', head: true }).eq('user_id', userId);
}

export async function replaceTrades(userId, strategyId, rows) {
  await db.from('trades').delete().eq('user_id', userId).eq('strategy_id', strategyId);
  return db.from('trades').insert(rows);
}
