import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Phone, Mail, Clock, 
  CheckCircle2, ArrowUpRight, UploadCloud,
  Webhook, UserPlus, Download, Sparkles, Trash2,
  MessageSquare
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { Lead } from '../data/mockData';
import { StatusBadge, ConfidenceBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { AddLeadModal } from '../components/ui/AddLeadModal';

export const Leads: React.FC = () => {
  const { leads, updateLead, loadDemoLeads, clearLeads } = useAppContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Modal control
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'csv' | 'manual' | 'webhook'>('csv');

  const openIngestionModal = (tab: 'csv' | 'manual' | 'webhook') => {
    setModalTab(tab);
    setIsAddModalOpen(true);
  };

  // Derived stats for summary strip
  const summary = useMemo(() => {
    return {
      all: leads.length,
      hot: leads.filter(l => l.status === 'Hot').length,
      warm: leads.filter(l => l.status === 'Warm').length,
      cold: leads.filter(l => l.status === 'Cold').length,
      uncontacted: leads.filter(l => !l.contacted).length
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads
      .filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()))
      .filter(l => statusFilter === 'All' || l.status === statusFilter)
      .sort((a, b) => b.currentScore - a.currentScore); // Default priority sort
  }, [leads, search, statusFilter]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-status-hot bg-status-hot/10';
    if (score >= 40) return 'text-status-warm bg-status-warm/10';
    return 'text-status-cold bg-status-cold/10';
  };

  // Mock data for the lead quality over time chart
  const timeData = selectedLead ? [
    { time: '0h', score: selectedLead.baseScore },
    { time: '2h', score: Math.round(selectedLead.baseScore * 0.95) },
    { time: '12h', score: Math.round(selectedLead.baseScore * 0.75) },
    { time: '24h', score: Math.round(selectedLead.baseScore * 0.50) },
    { time: 'Now', score: selectedLead.currentScore },
  ] : [];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto h-[calc(100vh-80px)] flex flex-col animate-in fade-in duration-500">
      
      {/* Action / Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 shrink-0">
        <div className="flex flex-wrap gap-2 md:gap-3">
          {[
            { label: 'All Leads', count: summary.all, filter: 'All' },
            { label: 'Hot', count: summary.hot, filter: 'Hot', color: 'text-status-hot' },
            { label: 'Warm', count: summary.warm, filter: 'Warm', color: 'text-status-warm' },
            { label: 'Cold', count: summary.cold, filter: 'Cold', color: 'text-status-cold' },
            { label: 'Uncontacted', count: summary.uncontacted, filter: 'All' }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setStatusFilter(item.filter)}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all ${
                statusFilter === item.filter && item.label !== 'Uncontacted'
                  ? 'bg-background-elevated border-primary text-text-primary shadow-sm'
                  : 'bg-background-card border-border text-text-secondary hover:border-border-hover'
              }`}
            >
              <span className={item.color || ''}>{item.label}</span>
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-background-primary text-[11px]">
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Global Ingestion Actions */}
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => openIngestionModal('csv')}
            className="text-xs"
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-primary" />
            Upload CSV
          </Button>

          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => openIngestionModal('webhook')}
            className="text-xs"
          >
            <Webhook className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
            Webhooks
          </Button>

          {leads.length > 0 ? (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={clearLeads}
              className="text-xs text-status-hot hover:bg-status-hot/10"
              title="Clear all leads to view empty state & guide"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear Queue
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={loadDemoLeads}
              className="text-xs text-primary border-primary/30 hover:bg-primary/10"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Load Demo Dataset
            </Button>
          )}
        </div>
      </div>

      {/* Main Workspace Split or Empty Onboarding Guide */}
      {leads.length === 0 ? (
        <div className="flex-1 border border-border bg-background-card rounded-2xl p-6 sm:p-8 flex flex-col justify-center items-center text-center overflow-y-auto">
          <div className="max-w-3xl space-y-6">
            
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Lead Ingestion Architecture • Real-Time Scoring
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                How Leads Flow into MetaLeadIQ
              </h2>
              <p className="text-sm text-text-muted mt-2 max-w-xl mx-auto">
                No hardcoded leads are pre-populated. Leads enter the queue through Meta Webhooks, WhatsApp/Instagram messaging, CSV dataset uploads, or manual entry.
              </p>
            </div>

            {/* 4 Ingestion Methods Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mt-6">
              
              {/* Method 1: CSV Upload */}
              <div 
                onClick={() => openIngestionModal('csv')}
                className="p-5 rounded-xl border border-border bg-background-elevated/40 hover:border-primary/50 hover:bg-hover-bg/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-primary/15 text-primary">
                    Batch Dataset
                  </span>
                </div>
                <h3 className="font-semibold text-text-primary text-sm group-hover:text-primary transition-colors">
                  Upload Campaign CSV
                </h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Drop a CSV file containing campaign data. Every row is instantly calibrated, decayed, and ordered into the priority queue.
                </p>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                  <span className="text-primary font-medium flex items-center gap-1">
                    Upload Dataset <ArrowUpRight className="w-3 h-3" />
                  </span>
                  <a 
                    href="/sample_leads_template.csv" 
                    download="sample_leads_template.csv"
                    onClick={(e) => e.stopPropagation()}
                    className="text-text-muted hover:text-text-primary flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Sample CSV
                  </a>
                </div>
              </div>

              {/* Method 2: Meta Webhooks */}
              <div 
                onClick={() => openIngestionModal('webhook')}
                className="p-5 rounded-xl border border-border bg-background-elevated/40 hover:border-blue-500/50 hover:bg-hover-bg/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Webhook className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-400">
                    Meta Lead Ads
                  </span>
                </div>
                <h3 className="font-semibold text-text-primary text-sm group-hover:text-blue-400 transition-colors">
                  Meta Lead Ads Webhook
                </h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Listens at <code className="text-blue-400 font-mono">POST /api/webhook/meta</code>. Ingests Instant Forms from Reels & Feed with HMAC SHA-256 validation.
                </p>
                <div className="mt-4 flex items-center pt-3 border-t border-border/50 text-xs text-blue-400 font-medium">
                  Test Webhook Simulator <ArrowUpRight className="w-3 h-3 ml-1" />
                </div>
              </div>

              {/* Method 3: Inbound Messaging */}
              <div 
                onClick={() => openIngestionModal('webhook')}
                className="p-5 rounded-xl border border-border bg-background-elevated/40 hover:border-green-500/50 hover:bg-hover-bg/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-green-500/15 text-green-400">
                    WhatsApp & Instagram
                  </span>
                </div>
                <h3 className="font-semibold text-text-primary text-sm group-hover:text-green-400 transition-colors">
                  Inbound Messaging Webhooks
                </h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Endpoints <code className="text-green-400 font-mono">/api/webhook/whatsapp</code> and <code className="text-purple-400 font-mono">/instagram</code> create leads and sync two-way conversations to the Unified Inbox.
                </p>
                <div className="mt-4 flex items-center pt-3 border-t border-border/50 text-xs text-green-400 font-medium">
                  Simulate Inbound Message <ArrowUpRight className="w-3 h-3 ml-1" />
                </div>
              </div>

              {/* Method 4: Manual Lead Entry */}
              <div 
                onClick={() => openIngestionModal('manual')}
                className="p-5 rounded-xl border border-border bg-background-elevated/40 hover:border-primary/50 hover:bg-hover-bg/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-purple-500/15 text-purple-400">
                    Instant Form
                  </span>
                </div>
                <h3 className="font-semibold text-text-primary text-sm group-hover:text-purple-400 transition-colors">
                  Manual Prospect Entry
                </h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Add prospects manually with real-time ML score calculation preview before submitting to the queue.
                </p>
                <div className="mt-4 flex items-center pt-3 border-t border-border/50 text-xs text-purple-400 font-medium">
                  Open Entry Form <ArrowUpRight className="w-3 h-3 ml-1" />
                </div>
              </div>

            </div>

            {/* Quick Demo Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="text-xs text-text-muted">Want to see the system with data?</span>
              <Button 
                onClick={loadDemoLeads}
                className="text-xs py-2 px-4 shadow-lg shadow-primary/20"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Load 10 Realistic Demo Leads
              </Button>
            </div>

          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          
          {/* Left Side: Lead Queue */}
          <div className={`flex-col lg:w-1/2 xl:w-5/12 border border-border bg-background-card rounded-xl overflow-hidden flex ${selectedLead ? 'hidden lg:flex' : 'flex'}`}>
            {/* Queue Header/Toolbar */}
            <div className="p-4 border-b border-border bg-background-elevated/50 flex flex-col sm:flex-row gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Search leads..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-input-bg border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <Button variant="outline" className="shrink-0" onClick={() => openIngestionModal('csv')}>
                <UploadCloud className="w-4 h-4 mr-1.5" />
                Add / Upload
              </Button>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-border">
                {filteredLeads.map((lead) => (
                  <div 
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-hover-bg group relative ${
                      selectedLead?.id === lead.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-text-primary">{lead.name}</h3>
                        <p className="text-xs text-text-muted mt-0.5">{lead.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className={`px-2 py-1 rounded text-xs font-bold ${getScoreColor(lead.currentScore)}`}>
                          {lead.currentScore}
                        </div>
                        <StatusBadge status={lead.status} className="scale-90 origin-right" />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-secondary mt-3">
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {lead.leadSource} • {lead.placement}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {lead.hoursUncontacted}h uncontacted
                      </span>
                    </div>

                    {/* Quick Actions (Hover) */}
                    <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-background-card/90 backdrop-blur-sm p-1 rounded-lg border border-border shadow-sm">
                      <button 
                        className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors" 
                        title="Call"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateLead(lead.id, { contacted: true });
                        }}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors" 
                        title="Email"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateLead(lead.id, { contacted: true });
                        }}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredLeads.length === 0 && (
                  <div className="p-8 text-center text-text-muted text-sm">
                    No leads matching search criteria.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Lead Inspector */}
          <div className={`flex-col lg:w-1/2 xl:w-7/12 border border-border bg-background-card rounded-xl overflow-hidden flex ${!selectedLead ? 'hidden lg:flex' : 'flex'}`}>
            {!selectedLead ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-background-elevated flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-text-muted" />
                </div>
                <h3 className="text-lg font-medium text-text-primary">Select a lead to view details</h3>
                <p className="text-sm text-text-muted mt-2 max-w-sm">
                  Choose a lead from the priority queue to view their mathematical scoring breakdown, confidence interval, and decay curve.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Inspector Header */}
                <div className="p-6 border-b border-border bg-background-elevated/30 shrink-0 relative">
                  <button 
                    onClick={() => setSelectedLead(null)}
                    className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary lg:hidden"
                  >
                    Close
                  </button>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-semibold text-text-primary">{selectedLead.name}</h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                        <span className="flex items-center gap-1.5"><Mail className="w-4 h-4"/> {selectedLead.email}</span>
                        <span className="flex items-center gap-1.5"><Phone className="w-4 h-4"/> {selectedLead.phone}</span>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-sm text-text-muted mb-1">Decayed Score</div>
                      <div className="text-3xl font-bold text-primary">{selectedLead.currentScore}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-6">
                    <StatusBadge status={selectedLead.status} />
                    <ConfidenceBadge confidence={selectedLead.confidence} />
                    <span className="text-xs text-text-muted px-2 py-1 rounded-md bg-background-elevated border border-border">
                      {selectedLead.conversionProbability}% Calibrated Prob
                    </span>
                    <span className="text-xs text-text-muted px-2 py-1 rounded-md bg-background-elevated border border-border">
                      {selectedLead.leadSource} • {selectedLead.placement}
                    </span>
                  </div>
                </div>

                {/* Inspector Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  
                  {/* Score Breakdown & Decay */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Score Breakdown */}
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary mb-4">Score Breakdown</h3>
                      <div className="space-y-4">
                        {[
                          { label: 'Base Model Score', value: selectedLead.baseScore },
                          { label: 'Time Decay Retention', value: Math.round((selectedLead.currentScore / Math.max(1, selectedLead.baseScore)) * 100) },
                          { label: 'Calibrated Probability', value: selectedLead.conversionProbability },
                          { label: 'Wald Lower Bound (95% CI)', value: selectedLead.predictionLower },
                          { label: 'Wald Upper Bound (95% CI)', value: selectedLead.predictionUpper },
                        ].map((metric, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-text-secondary">{metric.label}</span>
                              <span className="text-text-primary font-medium">{metric.value}%</span>
                            </div>
                            <div className="w-full bg-background-primary rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-primary h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, Math.max(0, metric.value))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Half-Life Decay Chart */}
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary mb-4">Half-Life Decay Curve (λ = ln2 / 24)</h3>
                      <div className="h-40 w-full bg-background-elevated/20 rounded-lg p-2 border border-border">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={timeData}>
                            <defs>
                              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                            <YAxis domain={[0, 100]} stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'var(--color-background-elevated)', 
                                borderColor: 'var(--color-border)', 
                                borderRadius: '8px', 
                                fontSize: '12px' 
                              }} 
                            />
                            <Area type="monotone" dataKey="score" stroke="var(--color-primary)" fillOpacity={1} fill="url(#scoreGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Campaign Attributes */}
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-4">Campaign & Engagement Attributes</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-3 bg-background-elevated/40 border border-border rounded-lg">
                        <span className="text-[11px] text-text-muted">Total Visits</span>
                        <div className="text-base font-semibold text-text-primary mt-1">{selectedLead.totalVisits}</div>
                      </div>
                      <div className="p-3 bg-background-elevated/40 border border-border rounded-lg">
                        <span className="text-[11px] text-text-muted">Time on Site</span>
                        <div className="text-base font-semibold text-text-primary mt-1">{selectedLead.timeOnWebsite} min</div>
                      </div>
                      <div className="p-3 bg-background-elevated/40 border border-border rounded-lg">
                        <span className="text-[11px] text-text-muted">Cost Per Click (CPC)</span>
                        <div className="text-base font-semibold text-text-primary mt-1">${selectedLead.cpc.toFixed(2)}</div>
                      </div>
                      <div className="p-3 bg-background-elevated/40 border border-border rounded-lg">
                        <span className="text-[11px] text-text-muted">Click-Through (CTR)</span>
                        <div className="text-base font-semibold text-text-primary mt-1">{selectedLead.ctr.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Mark Contacted Action */}
                  <div className="pt-2 flex justify-end">
                    <Button 
                      variant={selectedLead.contacted ? "outline" : "primary"}
                      onClick={() => updateLead(selectedLead.id, { contacted: !selectedLead.contacted })}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {selectedLead.contacted ? 'Marked Contacted (Decay Frozen)' : 'Mark as Contacted'}
                    </Button>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ingestion Modal */}
      <AddLeadModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialTab={modalTab}
      />
    </div>
  );
};
