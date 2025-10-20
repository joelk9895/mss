import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import Sidebar from './components/Layout/Sidebar';
import LawyerDashboard from './components/Dashboard/LawyerDashboard';
import ClientsModule from './components/Clients/ClientsModule';
import CasesModule from './components/Cases/CasesModule';
import AppointmentsModule from './components/Appointments/AppointmentsModule';
import DocumentsModule from './components/Documents/DocumentsModule';
import BillingModule from './components/Billing/BillingModule';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <LoginForm onSwitchToSignup={() => setAuthView('signup')} />
    ) : (
      <SignupForm onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <LawyerDashboard />;
      case 'clients':
        return <ClientsModule />;
      case 'cases':
        return <CasesModule />;
      case 'appointments':
        return <AppointmentsModule />;
      case 'documents':
        return <DocumentsModule />;
      case 'billing':
        return <BillingModule />;
      default:
        return <LawyerDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
