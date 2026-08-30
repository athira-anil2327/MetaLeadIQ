import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { mockLeads } from '../data/mockData';
import type { Lead } from '../data/mockData';

interface AppContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  leads: Lead[];
  addLead: (lead: Lead) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [leads, setLeads] = useState<Lead[]>(mockLeads);

  useEffect(() => {
    // Sync theme with body class
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addLead = (lead: Lead) => {
    setLeads((prev) => [lead, ...prev]);
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead))
    );
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, leads, addLead, updateLead }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
