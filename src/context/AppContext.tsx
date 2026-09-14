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
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    // Sync theme with body class
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  const fetchLeads = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/queue');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      const apiLeads: Lead[] = data.map((apiLead: any) => ({
        id: `L-${apiLead.id}`,
        name: apiLead.lead_name,
        email: `${apiLead.lead_name.toLowerCase().replace(' ', '.')}@example.com`,
        phone: "+1 (555) 000-0000",
        leadSource: "System",
        leadOrigin: "API",
        placement: "Queue",
        audienceType: "Dynamic",
        ctr: 2.0,
        cpc: apiLead.cpc,
        creativeType: "None",
        totalVisits: apiLead.total_visits,
        timeOnWebsite: apiLead.total_visits * 2,
        pageViews: Math.round(apiLead.total_visits * 1.5),
        lastActivity: "System Import",
        baseScore: Math.round(apiLead.base_score * 100),
        currentScore: Math.round(apiLead.decayed_score * 100),
        conversionProbability: Math.round(apiLead.decayed_score * 100),
        hoursUncontacted: apiLead.hours_uncontacted,
        status: apiLead.decayed_score > 0.7 ? 'Hot' : (apiLead.decayed_score > 0.4 ? 'Warm' : 'Cold'),
        confidence: apiLead.margin_of_error < 0.1 ? 'High' : (apiLead.margin_of_error < 0.2 ? 'Moderate' : 'Uncertain'),
        predictionLower: Math.round(apiLead.lower_bound * 100),
        predictionUpper: Math.round(apiLead.upper_bound * 100),
        submissionTime: new Date(Date.now() - apiLead.hours_uncontacted * 3600000).toISOString(),
        contacted: apiLead.contacted
      }));

      setLeads(apiLeads);
    } catch (error) {
      console.error("Failed to fetch leads from API, falling back to mock data:", error);
    }
  };

  useEffect(() => {
    fetchLeads();
    
    // Optional: poll every minute to keep queue fresh
    const intervalId = setInterval(fetchLeads, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addLead = (lead: Lead) => {
    setLeads((prev) => [lead, ...prev]);
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    // Optimistic UI update
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead))
    );

    // If marked as contacted, tell backend
    if (updates.contacted === true) {
      try {
        const backendId = id.replace('L-', '');
        await fetch(`http://localhost:8000/api/leads/${backendId}/contact`, {
          method: 'POST',
        });
      } catch (error) {
        console.error("Failed to update lead status on backend:", error);
      }
    }
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
