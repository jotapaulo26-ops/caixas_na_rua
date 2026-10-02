import { createClient } from '@supabase/supabase-js';
import { db } from './db';

// Chaves de armazenamento local
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

/**
 * Testa a conexão com o banco Supabase
 */
export async function testSupabaseConnection() {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Credenciais inválidas ou ausentes.' };
  }

  try {
    const { data, error } = await client.from('crate_types').select('id').limit(1);
    if (error) {
      // Se a tabela ainda não foi criada, alerta sobre o SQL
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

/**
 * Envia todos os dados locais do IndexedDB para o Supabase
 */
export async function syncLocalToSupabase() {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, reason: 'Supabase não conectado.' };
  }

  try {
    const clients = await db.clients.toArray();
    const crateTypes = await db.crateTypes.toArray();
    const transactions = await db.transactions.toArray();

    // 1. Tipos de caixas
    if (crateTypes.length > 0) {
      const payloadTypes = crateTypes.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color,
        unit_value: c.unitValue || 0,
        is_default: Boolean(c.isDefault)
      }));
      const { error: errTypes } = await client.from('crate_types').upsert(payloadTypes, { onConflict: 'id' });
      if (errTypes) throw errTypes;
    }

    // 2. Clientes
    if (clients.length > 0) {
      const payloadClients = clients.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        address: c.address || '',
        notes: c.notes || '',
        created_at: c.createdAt || new Date().toISOString()
      }));
      const { error: errClients } = await client.from('clients').upsert(payloadClients, { onConflict: 'id' });
      if (errClients) throw errClients;
    }

    // 3. Movimentações
    if (transactions.length > 0) {
      const payloadTrans = transactions.map(t => ({
        id: t.id,
        client_id: t.clientId,
        crate_type_id: t.crateTypeId,
        type: t.type,
        quantity: t.quantity,
        date: t.date,
        notes: t.notes || ''
      }));
      const { error: errTrans } = await client.from('transactions').upsert(payloadTrans, { onConflict: 'id' });
      if (errTrans) throw errTrans;
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao sincronizar com Supabase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Baixa todos os dados do Supabase para o IndexedDB local
 */
export async function syncSupabaseToLocal() {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, reason: 'Supabase não conectado.' };
  }

  try {
    const { data: remoteTypes, error: errTypes } = await client.from('crate_types').select('*');
    if (errTypes) throw errTypes;

    const { data: remoteClients, error: errClients } = await client.from('clients').select('*');
    if (errClients) throw errClients;

    const { data: remoteTrans, error: errTrans } = await client.from('transactions').select('*');
    if (errTrans) throw errTrans;

    await db.transaction('rw', db.clients, db.crateTypes, db.transactions, async () => {
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
            notes: rt.notes
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
