import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { Dashboard } from './pages/Dashboard';
import { CampaignAnalytics } from './pages/CampaignAnalytics';
import { LeadInsights } from './pages/LeadInsights';
import { Leads } from './pages/Leads';
import { Settings } from './pages/Settings';
import { AppProvider } from './context/AppContext';
import { AddLeadModal } from './components/ui/AddLeadModal';

const AppContent: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'leads':
        return <Leads />;
      case 'campaign-analytics':
        return <CampaignAnalytics />;
      case 'lead-insights':
        return <LeadInsights />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const getPageTitles = () => {
    switch (activePage) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: "Welcome back. Here's what's happening with your leads today." };
      case 'leads':
        return { title: 'Leads', subtitle: 'Manage, prioritize and convert your prospects.' };
      case 'campaign-analytics':
        return { title: 'Campaign Analytics', subtitle: 'Analyze lead generation and conversion performance.' };
      case 'lead-insights':
        return { title: 'Lead Insights', subtitle: 'Deep dive into lead characteristics and engagement.' };
      case 'settings':
        return { title: 'Settings', subtitle: 'Manage your dashboard preferences.' };
      default:
        return { title: 'Dashboard', subtitle: '' };
    }
  };

  const { title, subtitle } = getPageTitles();

  return (
    <div className="flex min-h-screen bg-background-primary transition-colors duration-300">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader 
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setIsSidebarOpen(true)}
          onAddLeadClick={() => setIsAddLeadOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden relative">
          <div className="absolute inset-0 bg-wave-pattern opacity-5 mix-blend-overlay pointer-events-none" />
          {renderPage()}
        </main>
      </div>

      <AddLeadModal 
        isOpen={isAddLeadOpen} 
        onClose={() => setIsAddLeadOpen(false)} 
      />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
