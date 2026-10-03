import Dexie from 'dexie';

export const db = new Dexie('CaixasNaRuaDB');

// Database schema version 2 with drivers and hubReturns (Ponto de Devolucao)
db.version(2).stores({
  clients: '++id, name, phone, address, notes, createdAt',
  crateTypes: '++id, name, color, unitValue, isDefault',
  transactions: '++id, clientId, crateTypeId, type, quantity, date, notes, driverId, driverName',
  drivers: '++id, name, phone, password, createdAt',
  hubReturns: '++id, driverId, driverName, crateTypeId, quantity, date, notes'
});

// Seed initial crate types if database is fresh
export function generateUniqueId() {
  // Gera um ID numérico único de 16 dígitos compatível com JS Number e PostgreSQL BIGINT
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

export async function initDatabaseDefaults() {
  const count = await db.crateTypes.count();
  if (count === 0) {
    await db.crateTypes.bulkAdd([
      { id: 1, name: 'Caixa Hortifrúti (Plástica)', color: '#22c55e', unitValue: 35.0, isDefault: true },
      { id: 2, name: 'Engradado de Bebidas', color: '#3b82f6', unitValue: 40.0, isDefault: true },
      { id: 3, name: 'Garrafão de Água 20L', color: '#06b6d4', unitValue: 25.0, isDefault: true },
      { id: 4, name: 'Palete de Madeira', color: '#f59e0b', unitValue: 60.0, isDefault: false },
      { id: 5, name: 'Caixa Térmica / Isopor', color: '#ec4899', unitValue: 50.0, isDefault: false },
    ]);
  }
}

// Driver authentication and registration helpers
export async function registerDriver({ name, phone = '', password }) {
  const cleanName = name.trim();
  const existing = await db.drivers.where('name').equalsIgnoreCase(cleanName).first();
  if (existing) {
    throw new Error('Já existe um entregador cadastrado com este nome.');
  }

  const id = generateUniqueId();
  await db.drivers.add({
    id,
    name: cleanName,
    phone: phone.trim(),
    password: password.trim(),
    createdAt: new Date().toISOString()
  });

  return { id, name: cleanName, phone: phone.trim() };
}

export async function authenticateDriver({ name, password }) {
  const cleanName = name.trim();
  const driver = await db.drivers.where('name').equalsIgnoreCase(cleanName).first();
  if (!driver) {
    throw new Error('Entregador não encontrado.');
  }

  if (driver.password.trim() !== password.trim()) {
    throw new Error('Senha incorreta.');
  }

  return { id: driver.id, name: driver.name, phone: driver.phone };
}

// Calculate balances per client
export async function getClientBalance(clientId) {
  const transactions = await db.transactions.where('clientId').equals(clientId).toArray();
  const crateTypes = await db.crateTypes.toArray();
  const crateMap = new Map(crateTypes.map(c => [c.id, c]));

  let totalBalance = 0;
  const byType = {};

  transactions.forEach(t => {
    const qty = t.type === 'DELIVERED' ? t.quantity : -t.quantity;
    totalBalance += qty;

    if (!byType[t.crateTypeId]) {
      byType[t.crateTypeId] = {
        crateTypeId: t.crateTypeId,
        crateName: crateMap.get(t.crateTypeId)?.name || 'Outro',
        color: crateMap.get(t.crateTypeId)?.color || '#94a3b8',
        balance: 0
      };
    }
    byType[t.crateTypeId].balance += qty;
  });

  let lastTransactionDate = null;
  if (transactions.length > 0) {
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    lastTransactionDate = sorted[0].date;
  }

  return {
    totalBalance,
    byType: Object.values(byType),
    lastTransactionDate
  };
}

// Hub Returns (Ponto de Devolução / Galpão Central)
export async function getHubStats() {
  const hubReturns = await db.hubReturns.toArray();
  const crateTypes = await db.crateTypes.toArray();
  const crateMap = new Map(crateTypes.map(c => [c.id, c]));

  let totalBoxesInHub = 0;
  const byCrateType = {};

  hubReturns.forEach(hr => {
    totalBoxesInHub += hr.quantity;
    if (!byCrateType[hr.crateTypeId]) {
      byCrateType[hr.crateTypeId] = {
        crateTypeId: hr.crateTypeId,
        name: crateMap.get(hr.crateTypeId)?.name || 'Outro',
        color: crateMap.get(hr.crateTypeId)?.color || '#94a3b8',
        total: 0
      };
    }
    byCrateType[hr.crateTypeId].total += hr.quantity;
  });

  return {
    totalBoxesInHub,
    byCrateType: Object.values(byCrateType),
    totalDischarges: hubReturns.length
  };
}

// Global summary statistics
export async function getGlobalStats() {
  const transactions = await db.transactions.toArray();
  const clients = await db.clients.toArray();
  const crateTypes = await db.crateTypes.toArray();
  const crateMap = new Map(crateTypes.map(c => [c.id, c]));

  let totalCratesInStreet = 0;
  let totalEstimatedValue = 0;
  const clientBalances = {};
  const crateTypeTotals = {};

  transactions.forEach(t => {
    const qty = t.type === 'DELIVERED' ? t.quantity : -t.quantity;
    totalCratesInStreet += qty;

    const unitVal = crateMap.get(t.crateTypeId)?.unitValue || 0;
    totalEstimatedValue += qty * unitVal;

    if (!clientBalances[t.clientId]) {
      clientBalances[t.clientId] = { balance: 0, lastDate: t.date };
    }
    clientBalances[t.clientId].balance += qty;
    if (new Date(t.date) > new Date(clientBalances[t.clientId].lastDate)) {
      clientBalances[t.clientId].lastDate = t.date;
    }

    if (!crateTypeTotals[t.crateTypeId]) {
      crateTypeTotals[t.crateTypeId] = {
        name: crateMap.get(t.crateTypeId)?.name || 'Outro',
        color: crateMap.get(t.crateTypeId)?.color || '#94a3b8',
        total: 0
      };
    }
    crateTypeTotals[t.crateTypeId].total += qty;
  });

  const clientsWithDebt = Object.entries(clientBalances).filter(([, val]) => val.balance > 0).length;

  const now = new Date();
  const stagnantClients = [];
  for (const [cId, val] of Object.entries(clientBalances)) {
    if (val.balance > 0) {
      const days = Math.floor((now - new Date(val.lastDate)) / (1000 * 60 * 60 * 24));
      if (days >= 7) {
        const client = clients.find(c => c.id === Number(cId));
        if (client) {
          stagnantClients.push({
            client,
            balance: val.balance,
            daysStagnant: days,
            lastDate: val.lastDate
          });
        }
      }
    }
  }

  stagnantClients.sort((a, b) => b.daysStagnant - a.daysStagnant);

  return {
    totalCratesInStreet,
    totalEstimatedValue,
    clientsWithDebt,
    totalClients: clients.length,
    byCrateType: Object.values(crateTypeTotals),
    stagnantClients
  };
}

// Backup & Export Functions
export async function exportAllDataJSON() {
  const clients = await db.clients.toArray();
  const crateTypes = await db.crateTypes.toArray();
  const transactions = await db.transactions.toArray();
  const drivers = await db.drivers.toArray();
  const hubReturns = await db.hubReturns.toArray();

  const backupData = {
    app: 'CaixasNaRua',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    clients,
    crateTypes,
    transactions,
    drivers,
    hubReturns
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-caixas-na-rua-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportCSVReport() {
  const clients = await db.clients.toArray();
  const clientMap = new Map(clients.map(c => [c.id, c]));
  const transactions = await db.transactions.toArray();
  const crateTypes = await db.crateTypes.toArray();
  const crateMap = new Map(crateTypes.map(c => [c.id, c]));

  let csv = 'Data,Hora,Cliente,Telefone,Tipo de Vasilhame,Operacao,Quantidade,Entregador,Observacoes\n';
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(t => {
    const d = new Date(t.date);
    const dateStr = d.toLocaleDateString('pt-BR');
    const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const client = clientMap.get(t.clientId);
    const clientName = (client?.name || 'Desconhecido').replace(/"/g, '""');
    const phone = client?.phone || '';
    const crateName = (crateMap.get(t.crateTypeId)?.name || 'Vasilhame').replace(/"/g, '""');
    const op = t.type === 'DELIVERED' ? 'DEIXOU (+)' : 'RECOLHEU (-)';
    const driver = (t.driverName || 'N/A').replace(/"/g, '""');
    const notes = (t.notes || '').replace(/"/g, '""');

    csv += `"${dateStr}","${timeStr}","${clientName}","${phone}","${crateName}","${op}",${t.quantity},"${driver}","${notes}"\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-movimentacoes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importDataJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data.clients || !data.transactions) {
      throw new Error('Arquivo de backup inválido.');
    }

    await db.transaction('rw', db.clients, db.crateTypes, db.transactions, db.drivers, db.hubReturns, async () => {
      await db.clients.clear();
      await db.crateTypes.clear();
      await db.transactions.clear();
      await db.drivers.clear();
      await db.hubReturns.clear();

      await db.clients.bulkAdd(data.clients);
      if (data.crateTypes && data.crateTypes.length > 0) {
        await db.crateTypes.bulkAdd(data.crateTypes);
      }
      await db.transactions.bulkAdd(data.transactions);
      if (data.drivers && data.drivers.length > 0) {
        await db.drivers.bulkAdd(data.drivers);
      }
      if (data.hubReturns && data.hubReturns.length > 0) {
        await db.hubReturns.bulkAdd(data.hubReturns);
      }
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
