import { createClient } from '@supabase/supabase-js';
import { db } from './db';

const STORAGE_URL_KEY = 'caixas_supabase_url';
const STORAGE_KEY_KEY = 'caixas_supabase_key';

export function getSupabaseConfig() {
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : '';

  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const url = (localUrl || envUrl).trim();
  const key = (localKey || envKey).trim();

  const isConfigured = Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    url !== 'https://seu-projeto.supabase.co'
  );

  return { url, key, isConfigured };
}

export function saveSupabaseConfig(url, key) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  }
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
}

export function getSupabaseClient() {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  return createClient(url, key);
}

export const isSupabaseConfigured = () => getSupabaseConfig().isConfigured;

let isSyncingInBackground = false;
let lastSyncTimestamp = null;
let lastSyncError = null;

const syncListeners = new Set();
export function subscribeSyncStatus(callback) {
  syncListeners.add(callback);
  callback({ isSyncing: isSyncingInBackground, lastSync: lastSyncTimestamp, error: lastSyncError });
  return () => syncListeners.delete(callback);
}

function notifySyncListeners() {
  const status = { isSyncing: isSyncingInBackground, lastSync: lastSyncTimestamp, error: lastSyncError };
  syncListeners.forEach(cb => cb(status));
}

export async function triggerAutoSync() {
  if (isSyncingInBackground) return;
  if (!isSupabaseConfigured() || !navigator.onLine) return;

  isSyncingInBackground = true;
  lastSyncError = null;
  notifySyncListeners();

  try {
    // 1. Sobe alterações feitas localmente para a nuvem
    const pushRes = await syncLocalToSupabase();
    // 2. Baixa dados novos cadastrados por outros entregadores na nuvem
    const pullRes = await syncSupabaseToLocal();

    if (pushRes.success && pullRes.success) {
      lastSyncTimestamp = new Date();
      lastSyncError = null;
    } else {
      lastSyncError = pushRes.error || pullRes.error || pushRes.reason || pullRes.reason;
    }
  } catch (err) {
    lastSyncError = err.message;
  } finally {
    isSyncingInBackground = false;
    notifySyncListeners();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    triggerAutoSync();
  });

  // Sincroniza ao reabrir ou focar no aplicativo no celular
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      triggerAutoSync();
    }
  });

  // Sincronização periódica em segundo plano a cada 45 segundos
  setInterval(() => {
    if (navigator.onLine && isSupabaseConfigured()) {
      triggerAutoSync();
    }
  }, 45000);
}

export async function testSupabaseConnection() {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Credenciais inválidas ou ausentes.' };
  }

  try {
    const { data, error } = await client.from('crate_types').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          error: 'Conexão OK, mas as tabelas ainda não foram criadas no Supabase! Execute o script supabase_schema.sql no SQL Editor.'
        };
      }
      throw error;
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Erro ao conectar ao Supabase' };
  }
}

export async function syncLocalToSupabase() {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, reason: 'Supabase não conectado.' };
  }

  try {
    const clients = await db.clients.toArray();
    const crateTypes = await db.crateTypes.toArray();
    const transactions = await db.transactions.toArray();
    const drivers = await db.drivers.toArray();
    const hubReturns = await db.hubReturns.toArray();

    // 1. Tipos de caixas
    if (crateTypes.length > 0) {
      const payloadTypes = crateTypes.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color,
        unit_value: c.unitValue || 0,
        is_default: Boolean(c.isDefault)
      }));
      const { error } = await client.from('crate_types').upsert(payloadTypes, { onConflict: 'id' });
      if (error) throw error;
    }

    // 2. Entregadores / Usuários
    if (drivers.length > 0) {
      const payloadDrivers = drivers.map(d => ({
        id: d.id,
        name: d.name,
        phone: d.phone || '',
        password: d.password,
        created_at: d.createdAt || new Date().toISOString()
      }));
      const { error } = await client.from('drivers').upsert(payloadDrivers, { onConflict: 'id' });
      if (error && error.code !== '42P01') throw error;
    }

    // 3. Clientes
    if (clients.length > 0) {
      const payloadClients = clients.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        address: c.address || '',
        notes: c.notes || '',
        created_at: c.createdAt || new Date().toISOString()
      }));
      const { error } = await client.from('clients').upsert(payloadClients, { onConflict: 'id' });
      if (error) throw error;
    }

    // 4. Movimentações com dados do entregador
    if (transactions.length > 0) {
      const payloadTrans = transactions.map(t => ({
        id: t.id,
        client_id: t.clientId,
        crate_type_id: t.crateTypeId,
        type: t.type,
        quantity: t.quantity,
        date: t.date,
        notes: t.notes || '',
        driver_id: t.driverId || null,
        driver_name: t.driverName || 'Entregador'
      }));
      const { error } = await client.from('transactions').upsert(payloadTrans, { onConflict: 'id' });
      if (error) throw error;
    }

    // 5. Ponto de Devolução (Galpão Central)
    if (hubReturns.length > 0) {
      const payloadHub = hubReturns.map(h => ({
        id: h.id,
        driver_id: h.driverId || null,
        driver_name: h.driverName || 'Entregador',
        crate_type_id: h.crateTypeId,
        quantity: h.quantity,
        date: h.date,
        notes: h.notes || ''
      }));
      const { error } = await client.from('hub_returns').upsert(payloadHub, { onConflict: 'id' });
      if (error && error.code !== '42P01') throw error;
    }

    lastSyncTimestamp = new Date();
    return { success: true };
  } catch (error) {
    console.error('Erro ao sincronizar com Supabase:', error);
    return { success: false, error: error.message };
  }
}

export async function syncSupabaseToLocal() {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, reason: 'Supabase não conectado.' };
  }

  try {
    const { data: remoteTypes } = await client.from('crate_types').select('*');
    const { data: remoteDrivers } = await client.from('drivers').select('*');
    const { data: remoteClients } = await client.from('clients').select('*');
    const { data: remoteTrans } = await client.from('transactions').select('*');
    const { data: remoteHub } = await client.from('hub_returns').select('*');

    await db.transaction('rw', db.clients, db.crateTypes, db.transactions, db.drivers, db.hubReturns, async () => {
      if (remoteTypes && remoteTypes.length > 0) {
        for (const rt of remoteTypes) {
          await db.crateTypes.put({
            id: rt.id,
            name: rt.name,
            color: rt.color,
            unitValue: rt.unit_value,
            isDefault: rt.is_default
          });
        }
      }

      if (remoteDrivers && remoteDrivers.length > 0) {
        for (const rd of remoteDrivers) {
          await db.drivers.put({
            id: rd.id,
            name: rd.name,
            phone: rd.phone,
            password: rd.password,
            createdAt: rd.created_at
          });
        }
      }

      if (remoteClients && remoteClients.length > 0) {
        for (const rc of remoteClients) {
          await db.clients.put({
            id: rc.id,
            name: rc.name,
            phone: rc.phone,
            address: rc.address,
            notes: rc.notes,
            createdAt: rc.created_at
          });
        }
      }

      if (remoteTrans && remoteTrans.length > 0) {
        for (const rt of remoteTrans) {
          await db.transactions.put({
            id: rt.id,
            clientId: rt.client_id,
            crateTypeId: rt.crate_type_id,
            type: rt.type,
            quantity: rt.quantity,
            date: rt.date,
            notes: rt.notes,
            driverId: rt.driver_id,
            driverName: rt.driver_name
          });
        }
      }

      if (remoteHub && remoteHub.length > 0) {
        for (const rh of remoteHub) {
          await db.hubReturns.put({
            id: rh.id,
            driverId: rh.driver_id,
            driverName: rh.driver_name,
            crateTypeId: rh.crate_type_id,
            quantity: rh.quantity,
            date: rh.date,
            notes: rh.notes
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao baixar dados do Supabase:', error);
    return { success: false, error: error.message };
  }
}
