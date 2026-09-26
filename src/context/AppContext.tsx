import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Lead } from '../data/mockData';
import { mockLeads } from '../data/mockData';
import type { InboxConversation, InboxMessage } from '../data/inboxTypes';
import { calculateLeadScores } from '../lib/leadScorer';

const API_BASE = 'http://localhost:8000/api';

interface AppContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  leads: Lead[];
  isLiveBackend: boolean;
  refreshLeads: () => Promise<void>;
  addLead: (leadData: Partial<Lead>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  importLeads: (newLeads: Lead[]) => void;
  loadDemoLeads: () => void;
  clearLeads: () => void;
  // Unified Inbox
  conversations: InboxConversation[];
  messages: Record<string, InboxMessage[]>;
  sendReply: (conversationId: string, body: string) => Promise<void>;
  simulateInboundMessage: (
    channel: 'whatsapp' | 'instagram',
    name: string,
    externalId: string,
    text: string
  ) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('metaleadiq_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  // Leads state starts empty or from saved localStorage (No forced hardcoded leads)
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem('metaleadiq_leads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved leads from localStorage', e);
    }
    return [];
  });

  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);

  // Unified Inbox state
  const [conversations, setConversations] = useState<InboxConversation[]>(() => {
    try {
      const saved = localStorage.getItem('metaleadiq_conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [messages, setMessages] = useState<Record<string, InboxMessage[]>>(() => {
    try {
      const saved = localStorage.getItem('metaleadiq_messages');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {};
  });

  // Save leads to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('metaleadiq_leads', JSON.stringify(leads));
  }, [leads]);

  // Save conversations and messages
  useEffect(() => {
    localStorage.setItem('metaleadiq_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('metaleadiq_messages', JSON.stringify(messages));
  }, [messages]);

  // Sync theme with DOM and localStorage
  useEffect(() => {
    localStorage.setItem('metaleadiq_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const normalizeApiLead = (item: any): Lead => {
    const rawScore = Number(item.decayed_score ?? item.currentScore ?? item.base_score ?? item.baseScore ?? 50);
    const score = Math.round(rawScore <= 1.0 ? rawScore * 100 : rawScore);
    const baseScore = Math.round(Number(item.base_score ?? item.baseScore ?? score));
    const prob = Math.round(Number(item.calibrated_probability ?? item.conversionProbability ?? (score / 100)) * (item.calibrated_probability <= 1.0 ? 100 : 1));
    const visits = Math.max(1, Number(item.total_visits ?? item.totalVisits ?? 1));
    const hours = Number(item.hours_uncontacted ?? item.hoursUncontacted ?? 0.1);

    return {
      id: String(item.id).startsWith('L-') ? String(item.id) : `L-${item.id}`,
      name: item.full_name || item.name || item.lead_name || 'Prospect',
      email: item.email || '',
      phone: item.phone || '',
      leadSource: item.source || item.lead_source || item.leadSource || 'Meta',
      leadOrigin: item.lead_origin || item.leadOrigin || 'API Ingestion',
      placement: item.ad_placement || item.placement || 'Reels',
      audienceType: item.audience_type || item.audienceType || 'Broad',
      ctr: Number(item.ctr ?? 2.5),
      cpc: Number(item.cpc ?? 1.25),
      creativeType: item.creative_type || item.creativeType || 'Video',
      totalVisits: visits,
      timeOnWebsite: Number(item.time_on_website ?? ((item.time_on_site_seconds ? item.time_on_site_seconds / 60 : visits * 2.0))),
      pageViews: Number(item.page_views ?? item.pageViews ?? Math.round(visits * 1.5)),
      lastActivity: item.last_activity || item.lastActivity || 'Form Submitted',
      baseScore,
      currentScore: score,
      conversionProbability: prob,
      hoursUncontacted: hours,
      status: score >= 70 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold',
      confidence: (item.confidence_level || item.confidence || (visits >= 4 ? 'High' : visits >= 2 ? 'Moderate' : 'Uncertain')) as any,
      predictionLower: Math.round(Number(item.ci_lower ?? item.prediction_lower ?? item.predictionLower ?? Math.max(10, score - 8))),
      predictionUpper: Math.round(Number(item.ci_upper ?? item.prediction_upper ?? item.predictionUpper ?? Math.min(99, score + 8))),
      submissionTime: item.submitted_at || item.submission_time || item.submissionTime || new Date(Date.now() - hours * 3600000).toISOString(),
      contacted: Boolean(item.contacted),
    };
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${API_BASE}/leads`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped = data.map(normalizeApiLead);
          setLeads(mapped);
          setIsLiveBackend(true);
          return;
        }
      }

      const queueRes = await fetch(`${API_BASE}/queue`);
      if (queueRes.ok) {
        const queueData = await queueRes.json();
        if (Array.isArray(queueData)) {
          const mapped = queueData.map(normalizeApiLead);
          setLeads(mapped);
          setIsLiveBackend(true);
          return;
        }
      }
    } catch (error) {
      // Backend offline
    }
    setIsLiveBackend(false);
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/inbox`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setConversations(data.map((c: any) => ({
            id: String(c.id),
            leadId: String(c.lead_id),
            leadName: c.full_name || `Lead #${c.lead_id}`,
            channel: c.channel,
            externalId: c.external_id,
            createdAt: c.created_at,
            leadScore: c.base_score,
            leadStatus: c.base_score >= 70 ? 'Hot' : c.base_score >= 40 ? 'Warm' : 'Cold',
          })));
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLeads();
    fetchConversations();
    const intervalId = setInterval(() => {
      fetchLeads();
      fetchConversations();
    }, 20000);
    return () => clearInterval(intervalId);
  }, []);

  const refreshLeads = async () => {
    await fetchLeads();
    await fetchConversations();
  };

  const addLead = async (leadData: Partial<Lead>) => {
    if (isLiveBackend) {
      try {
        const payload = {
          name: leadData.name || 'New Lead',
          full_name: leadData.name || 'New Lead',
          email: leadData.email || '',
          phone: leadData.phone || '',
          lead_source: leadData.leadSource || 'Instagram',
          source: leadData.leadSource || 'Instagram',
          placement: leadData.placement || 'Reels',
          ad_placement: leadData.placement || 'Reels',
          audience_type: leadData.audienceType || 'Broad',
          creative_type: leadData.creativeType || 'Video',
          total_visits: leadData.totalVisits || 2,
          time_on_website: leadData.timeOnWebsite || 4.5,
          time_on_site_seconds: Math.round((leadData.timeOnWebsite || 4.5) * 60),
          page_views: leadData.pageViews || 2,
          last_activity: leadData.lastActivity || 'Form Submitted',
          cpc: leadData.cpc || 1.25,
          ctr: leadData.ctr || 2.5,
        };

        const res = await fetch(`${API_BASE}/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const serverLead = await res.json();
          const normalized = normalizeApiLead(serverLead);
          setLeads((prev) => [normalized, ...prev]);
          return;
        }
      } catch (err) {
        console.error('Error posting lead to API:', err);
      }
    }

    // Client-side real-time calculation if offline
    const scored = calculateLeadScores(leadData as any);
    setLeads((prev) => [scored, ...prev]);
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead))
    );

    if (updates.contacted === true) {
      const rawId = id.startsWith('L-') ? id.replace('L-', '') : id;
      try {
        await fetch(`${API_BASE}/leads/${rawId}/contact`, { method: 'POST' });
      } catch (e) {}
    }
  };

  const deleteLead = async (id: string) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== id));
    const rawId = id.startsWith('L-') ? id.replace('L-', '') : id;
    try {
      await fetch(`${API_BASE}/leads/${rawId}`, { method: 'DELETE' });
    } catch (e) {}
  };

  const importLeads = (newLeads: Lead[]) => {
    setLeads((prev) => {
      const existingIds = new Set(prev.map(l => l.id));
      const filtered = newLeads.filter(l => !existingIds.has(l.id));
      return [...filtered, ...prev];
    });
  };

  const loadDemoLeads = () => {
    const demo = mockLeads.slice(0, 10);
    setLeads(demo);

    // Also populate demo conversations
    const demoConvs: InboxConversation[] = [
      {
        id: 'conv-1',
        leadId: demo[0].id,
        leadName: demo[0].name,
        channel: 'whatsapp',
        externalId: demo[0].phone || '+1 555-180-7964',
        createdAt: new Date().toISOString(),
        lastMessage: 'Hi, I saw your ad on Reels. Can you share pricing for the business plan?',
        lastMessageTimestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        leadScore: demo[0].currentScore,
        leadStatus: demo[0].status,
        unreadCount: 1,
      },
      {
        id: 'conv-2',
        leadId: demo[1].id,
        leadName: demo[1].name,
        channel: 'instagram',
        externalId: '@sophia_taylor',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        lastMessage: 'Is the onboarding session recorded or live?',
        lastMessageTimestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        leadScore: demo[1].currentScore,
        leadStatus: demo[1].status,
        unreadCount: 0,
      }
    ];

    const demoMsgs: Record<string, InboxMessage[]> = {
      'conv-1': [
        {
          id: 'm1',
          conversationId: 'conv-1',
          direction: 'inbound',
          channel: 'whatsapp',
          body: 'Hello! I submitted a lead form on Instagram earlier.',
          timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        },
        {
          id: 'm2',
          conversationId: 'conv-1',
          direction: 'inbound',
          channel: 'whatsapp',
          body: 'Hi, I saw your ad on Reels. Can you share pricing for the business plan?',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        }
      ],
      'conv-2': [
        {
          id: 'm3',
          conversationId: 'conv-2',
          direction: 'inbound',
          channel: 'instagram',
          body: 'Is the onboarding session recorded or live?',
          timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        }
      ]
    };

    setConversations(demoConvs);
    setMessages(demoMsgs);
  };

  const clearLeads = () => {
    setLeads([]);
    setConversations([]);
    setMessages({});
    localStorage.removeItem('metaleadiq_leads');
    localStorage.removeItem('metaleadiq_conversations');
    localStorage.removeItem('metaleadiq_messages');
  };

  const sendReply = async (conversationId: string, body: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    const newMsg: InboxMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      direction: 'outbound',
      channel: conv?.channel || 'whatsapp',
      body,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMsg],
    }));

    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId
          ? { ...c, lastMessage: body, lastMessageTimestamp: newMsg.timestamp, unreadCount: 0 }
          : c
      )
    );

    // Attempt backend sync
    try {
      await fetch(`${API_BASE}/inbox/${conversationId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
    } catch (e) {}
  };

  const simulateInboundMessage = async (
    channel: 'whatsapp' | 'instagram',
    name: string,
    externalId: string,
    text: string
  ) => {
    // 1. Ingest new lead or locate existing
    let lead = leads.find(l => (channel === 'whatsapp' ? l.phone === externalId : l.name === name));
    if (!lead) {
      lead = calculateLeadScores({
        name,
        phone: channel === 'whatsapp' ? externalId : '',
        lead_source: channel === 'whatsapp' ? 'WhatsApp' : 'Instagram',
        placement: channel === 'whatsapp' ? 'Direct Message' : 'Direct Message',
        total_visits: 3,
        time_on_site_seconds: 180,
      });
      setLeads(prev => [lead!, ...prev]);
    }

    // 2. Locate or create conversation
    let conv = conversations.find(c => c.channel === channel && c.externalId === externalId);
    let convId = conv ? conv.id : `conv-${Date.now()}`;

    if (!conv) {
      conv = {
        id: convId,
        leadId: lead.id,
        leadName: name,
        channel,
        externalId,
        createdAt: new Date().toISOString(),
        lastMessage: text,
        lastMessageTimestamp: new Date().toISOString(),
        leadScore: lead.currentScore,
        leadStatus: lead.status,
        unreadCount: 1,
      };
      setConversations(prev => [conv!, ...prev]);
    } else {
      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, lastMessage: text, lastMessageTimestamp: new Date().toISOString(), unreadCount: (c.unreadCount || 0) + 1 }
            : c
        )
      );
    }

    // 3. Add message
    const newMsg: InboxMessage = {
      id: `msg-${Date.now()}`,
      conversationId: convId,
      direction: 'inbound',
      channel,
      body: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        leads,
        isLiveBackend,
        refreshLeads,
        addLead,
        updateLead,
        deleteLead,
        importLeads,
        loadDemoLeads,
        clearLeads,
        conversations,
        messages,
        sendReply,
        simulateInboundMessage,
      }}
    >
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
