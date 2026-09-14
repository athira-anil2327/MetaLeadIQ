import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Filter, Phone, Mail, Clock, 
  CheckCircle2, Calendar, MousePointer2, 
  Eye, FileText, ArrowUpRight
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { Lead } from '../data/mockData';
import { StatusBadge, ConfidenceBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';

export const Leads: React.FC = () => {
  const { leads, updateLead } = useAppContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

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
    { time: '2h', score: selectedLead.baseScore - Math.random() * 5 },
    { time: '12h', score: selectedLead.baseScore - Math.random() * 15 - 5 },
    { time: '24h', score: selectedLead.baseScore - Math.random() * 25 - 10 },
    { time: 'Now', score: selectedLead.currentScore },
  ] : [];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto h-[calc(100vh-80px)] flex flex-col animate-in fade-in duration-500">
      
      {/* Lead Summary Strip */}
      <div className="flex flex-wrap gap-2 md:gap-4 mb-6 shrink-0">
        {[
          { label: 'All Leads', count: summary.all, filter: 'All' },
          { label: 'Hot', count: summary.hot, filter: 'Hot', color: 'text-status-hot' },
          { label: 'Warm', count: summary.warm, filter: 'Warm', color: 'text-status-warm' },
          { label: 'Cold', count: summary.cold, filter: 'Cold', color: 'text-status-cold' },
          { label: 'Uncontacted', count: summary.uncontacted, filter: 'All' } // Simplified for now
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => setStatusFilter(item.filter)}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
              statusFilter === item.filter && item.label !== 'Uncontacted'
                ? 'bg-background-elevated border-primary text-text-primary shadow-sm'
                : 'bg-background-card border-border text-text-secondary hover:border-border-hover'
            }`}
          >
            <span className={item.color || ''}>{item.label}</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-background-primary text-xs">
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Workspace Split */}
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
            <Button variant="outline" className="shrink-0">
              <Filter className="w-4 h-4 mr-2" />
              Filter
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
                    <button className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Call">
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Email">
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Follow Up">
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredLeads.length === 0 && (
                <div className="p-8 text-center text-text-muted text-sm">
                  No leads found.
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
                Choose a lead from the queue to view their complete profile, score breakdown, and activity history.
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
                    <div className="text-sm text-text-muted mb-1">Score</div>
                    <div className="text-3xl font-bold text-primary">{selectedLead.currentScore}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-6">
                  <StatusBadge status={selectedLead.status} />
                  <ConfidenceBadge confidence={selectedLead.confidence} />
                  <span className="text-xs text-text-muted px-2 py-1 rounded-md bg-background-elevated border border-border">
                    {selectedLead.conversionProbability}% Conv. Prob
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
                        { label: 'Intent', value: 85 },
                        { label: 'Engagement', value: 72 },
                        { label: 'Recency', value: selectedLead.status === 'Hot' ? 95 : 40 },
                        { label: 'Profile Fit', value: 88 }
                      ].map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-text-secondary">{item.label}</span>
                            <span className="font-medium">{item.value}/100</span>
                          </div>
                          <div className="h-1.5 w-full bg-background-elevated rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${item.value > 80 ? 'bg-status-hot' : item.value > 50 ? 'bg-status-warm' : 'bg-status-cold'}`} 
                              style={{ width: `${item.value}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Decay Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center justify-between">
                      <span>Priority Decay</span>
                      <span className="text-xs font-normal text-status-cold">
                        -{selectedLead.baseScore - selectedLead.currentScore} pts lost
                      </span>
                    </h3>
                    <div className="bg-background-elevated/30 border border-border rounded-lg p-3 h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timeData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="decayGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="rgb(var(--color-primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="rgb(var(--color-primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgb(var(--text-muted))' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgb(var(--text-muted))' }} domain={['dataMin - 10', 'dataMax + 10']} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--border-color))', fontSize: '12px' }}
                            itemStyle={{ color: 'rgb(var(--text-primary))' }}
                          />
                          <Area type="monotone" dataKey="score" stroke="rgb(var(--color-primary))" fillOpacity={1} fill="url(#decayGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-4">Activity Timeline</h3>
                  <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:to-transparent">
                    {/* Event 1 */}
                    <div className="relative flex items-start gap-4">
                      <div className="absolute left-[-26px] bg-background-card border-2 border-primary rounded-full w-3.5 h-3.5 mt-1" />
                      <div className="bg-background-elevated/40 border border-border rounded-lg p-3 flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-text-primary flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            Form Submitted
                          </span>
                          <span className="text-xs text-text-muted">Today, 10:42 AM</span>
                        </div>
                        <p className="text-xs text-text-secondary">Submitted info via Meta Lead Form on {selectedLead.placement}.</p>
                      </div>
                    </div>
                    {/* Event 2 */}
                    <div className="relative flex items-start gap-4">
                      <div className="absolute left-[-26px] bg-background-card border-2 border-border rounded-full w-3.5 h-3.5 mt-1" />
                      <div className="bg-background-elevated/40 border border-border rounded-lg p-3 flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-text-primary flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5 text-text-secondary" />
                            Pricing Page View
                          </span>
                          <span className="text-xs text-text-muted">Today, 10:35 AM</span>
                        </div>
                        <p className="text-xs text-text-secondary">Spent {selectedLead.timeOnWebsite} mins on site, viewed {selectedLead.pageViews} pages.</p>
                      </div>
                    </div>
                    {/* Event 3 */}
                    <div className="relative flex items-start gap-4">
                      <div className="absolute left-[-26px] bg-background-card border-2 border-border rounded-full w-3.5 h-3.5 mt-1" />
                      <div className="bg-background-elevated/40 border border-border rounded-lg p-3 flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-text-primary flex items-center gap-2">
                            <MousePointer2 className="w-3.5 h-3.5 text-text-secondary" />
                            Ad Click
                          </span>
                          <span className="text-xs text-text-muted">Today, 10:33 AM</span>
                        </div>
                        <p className="text-xs text-text-secondary">Clicked ad: {selectedLead.creativeType} ({selectedLead.audienceType})</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Area (Sticky Bottom) */}
              <div className="p-4 border-t border-border bg-background-card shrink-0 flex flex-wrap gap-3">
                <Button className="flex-1 min-w-[120px]">
                  <Phone className="w-4 h-4 mr-2" />
                  Log Call
                </Button>
                <Button variant="outline" className="flex-1 min-w-[120px]">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" className="flex-1 min-w-[120px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
                <Button 
                  variant="outline" 
                  className={`flex-1 min-w-[120px] ${selectedLead.contacted ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' : ''}`}
                  onClick={() => updateLead(selectedLead.id, { contacted: true })}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {selectedLead.contacted ? 'Converted' : 'Convert'}
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
