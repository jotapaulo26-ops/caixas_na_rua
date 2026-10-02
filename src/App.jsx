import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import QuickMovement from './components/QuickMovement';
import ClientList from './components/ClientList';
import ClientDetail from './components/ClientDetail';
import ClientModal from './components/ClientModal';
import HubReturn from './components/HubReturn';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Login from './components/Login';
import { initDatabaseDefaults, getGlobalStats } from './db/db';
import { triggerAutoSync } from './db/supabase';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';

export default function App() {
  const [currentDriver, setCurrentDriver] = useState(() => {
    try {
      const stored = localStorage.getItem('caixas_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('caixas_auth_token'));
  });

  const [activeTab, setActiveTab] = useState('quick'); // 'quick', 'clients', 'hub', 'dashboard', 'settings'
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [alertCount, setAlertCount] = useState(0);

  // Initialize defaults and auto-sync on mount
  useEffect(() => {
    initDatabaseDefaults();
    triggerAutoSync();
  }, []);

  // Update alert count for stagnant crates
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const clients = useLiveQuery(() => db.clients.toArray()) || [];

  useEffect(() => {
    getGlobalStats().then((stats) => {
      setAlertCount(stats.stagnantClients.length);
    });
  }, [transactions, clients]);

  const handleLoginSuccess = (driver) => {
    setCurrentDriver(driver);
    setIsAuthenticated(true);
    triggerAutoSync();
  };

  const handleLogout = () => {
    if (window.confirm('Deseja trocar de entregador ou sair do aplicativo?')) {
      localStorage.removeItem('caixas_auth_token');
      localStorage.removeItem('caixas_auth_user');
      setCurrentDriver(null);
      setIsAuthenticated(false);
    }
  };

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

  // If user is not authenticated, render Login / Register screen
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Header */}
      <Header
        currentDriver={currentDriver}
        onNewClientClick={handleOpenNewClient}
        onLogout={handleLogout}
      />

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
              <QuickMovement
                onNewClientClick={handleOpenNewClient}
                currentDriver={currentDriver}
              />
            )}
            {activeTab === 'clients' && (
              <ClientList
                onSelectClient={handleSelectClient}
                onNewClientClick={handleOpenNewClient}
              />
            )}
            {activeTab === 'hub' && (
              <HubReturn currentDriver={currentDriver} />
            )}
            {activeTab === 'dashboard' && (
              <Dashboard onSelectClient={handleSelectClient} />
            )}
            {activeTab === 'settings' && <Settings />}
          </>
        )}
      </main>

      {/* Bottom Navigation with 5 tabs */}
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
