import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import QuickMovement from './components/QuickMovement';
import ClientList from './components/ClientList';
import ClientDetail from './components/ClientDetail';
import ClientModal from './components/ClientModal';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { initDatabaseDefaults, getGlobalStats } from './db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';

export default function App() {
  const [activeTab, setActiveTab] = useState('quick'); // 'quick', 'clients', 'dashboard', 'settings'
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [alertCount, setAlertCount] = useState(0);

  // Initialize defaults on mount
  useEffect(() => {
    initDatabaseDefaults();
  }, []);

  // Update alert count for bottom nav badge
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const clients = useLiveQuery(() => db.clients.toArray()) || [];

  useEffect(() => {
    getGlobalStats().then((stats) => {
      setAlertCount(stats.stagnantClients.length);
    });
  }, [transactions, clients]);

  const handleOpenNewClient = () => {
    setClientToEdit(null);
    setIsClientModalOpen(true);
  };

  const handleEditClient = (client) => {
    setClientToEdit(client);
    setIsClientModalOpen(true);
  };

  const handleSelectClient = (id) => {
    setSelectedClientId(id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Header */}
      <Header onNewClientClick={handleOpenNewClient} />

      {/* Main Content Area */}
      <main className="flex-1 pb-24">
        {selectedClientId ? (
          <ClientDetail
            clientId={selectedClientId}
            onBack={() => setSelectedClientId(null)}
            onEditClient={handleEditClient}
          />
        ) : (
          <>
            {activeTab === 'quick' && (
              <QuickMovement onNewClientClick={handleOpenNewClient} />
            )}
            {activeTab === 'clients' && (
              <ClientList
                onSelectClient={handleSelectClient}
                onNewClientClick={handleOpenNewClient}
              />
            )}
            {activeTab === 'dashboard' && (
              <Dashboard onSelectClient={handleSelectClient} />
            )}
            {activeTab === 'settings' && <Settings />}
          </>
        )}
      </main>

      {/* Bottom Thumb Navigation Bar */}
      <BottomNav
        activeTab={selectedClientId ? 'clients' : activeTab}
        onChangeTab={(tab) => {
          setSelectedClientId(null);
          setActiveTab(tab);
        }}
        alertCount={alertCount}
      />

      {/* New / Edit Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        clientToEdit={clientToEdit}
      />
    </div>
  );
}
