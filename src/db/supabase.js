import { createClient } from '@supabase/supabase-js';
import { db } from './db';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://seu-projeto.supabase.co' &&
    !supabaseUrl.includes('placeholder')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Envia todos os dados locais do IndexedDB para a nuvem Supabase
 */
export async function syncLocalToSupabase() {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, reason: 'Supabase não configurado no .env' };
  }

  try {
    const clients = await db.clients.toArray();
    const crateTypes = await db.crateTypes.toArray();
    const transactions = await db.transactions.toArray();

    // 1. Sincronizar tipos de caixas
    if (crateTypes.length > 0) {
      const payloadTypes = crateTypes.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color,
        unit_value: c.unitValue || 0,
        is_default: Boolean(c.isDefault)
      }));
      const { error: errTypes } = await supabase.from('crate_types').upsert(payloadTypes, { onConflict: 'id' });
      if (errTypes) throw errTypes;
    }

    // 2. Sincronizar clientes
    if (clients.length > 0) {
      const payloadClients = clients.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        address: c.address || '',
        notes: c.notes || '',
        created_at: c.createdAt || new Date().toISOString()
      }));
      const { error: errClients } = await supabase.from('clients').upsert(payloadClients, { onConflict: 'id' });
      if (errClients) throw errClients;
    }

    // 3. Sincronizar movimentações
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
      const { error: errTrans } = await supabase.from('transactions').upsert(payloadTrans, { onConflict: 'id' });
      if (errTrans) throw errTrans;
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao sincronizar com Supabase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Baixa dados da nuvem Supabase para o IndexedDB local (offline storage)
 */
export async function syncSupabaseToLocal() {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, reason: 'Supabase não configurado no .env' };
  }

  try {
    const { data: remoteTypes, error: errTypes } = await supabase.from('crate_types').select('*');
    if (errTypes) throw errTypes;

    const { data: remoteClients, error: errClients } = await supabase.from('clients').select('*');
    if (errClients) throw errClients;

    const { data: remoteTrans, error: errTrans } = await supabase.from('transactions').select('*');
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
