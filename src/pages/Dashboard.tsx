import React, { useState, useMemo } from 'react';
import { Users, Flame, TrendingUp, Clock, Search, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { LeadInspector } from '../components/ui/LeadInspector';
import { StatusBadge, ConfidenceBadge } from '../components/ui/Badge';
import { useAppContext } from '../context/AppContext';
import type { Lead } from '../data/mockData';

export const Dashboard: React.FC = () => {
  const { leads, updateLead } = useAppContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [placementFilter, setPlacementFilter] = useState('All');
  const [audienceFilter, setAudienceFilter] = useState('All');
  const [scoreRange, setScoreRange] = useState(0);
  const [sortBy, setSortBy] = useState('Priority');
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const stats = useMemo(() => {
    const hotLeads = leads.filter(l => l.status === 'Hot').length;
    const avgProb = leads.length > 0 ? Math.round(leads.reduce((acc, l) => acc + l.conversionProbability, 0) / leads.length) : 0;
    const avgUncontacted = leads.length > 0 ? (leads.reduce((acc, l) => acc + l.hoursUncontacted, 0) / leads.length).toFixed(1) : '0.0';
    
    return [
      { 
        title: 'Total Leads', 
        value: leads.length.toString(), 
        indicator: '↑ 12.5% from yesterday', 
        icon: Users,
        color: 'text-primary'
      },
      { 
        title: 'Hot Leads', 
        value: hotLeads.toString(), 
        indicator: '↑ 8.4% from yesterday', 
        icon: Flame,
        color: 'text-status-hot'
      },
      { 
        title: 'Average Conversion Probability', 
        value: `${avgProb}%`, 
        indicator: '↑ 4.7% from yesterday', 
        icon: TrendingUp,
        color: 'text-primary'
      },
      { 
        title: 'Average Time Uncontacted', 
        value: `${avgUncontacted} hrs`, 
        indicator: '↓ 1.3 hrs from yesterday', 
        icon: Clock,
        color: 'text-primary'
      }
    ];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads
      .filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()))
      .filter(l => statusFilter === 'All' || l.status === statusFilter)
      .filter(l => placementFilter === 'All' || l.placement === placementFilter)
      .filter(l => audienceFilter === 'All' || l.audienceType === audienceFilter)
      .filter(l => l.currentScore >= scoreRange)
      .sort((a, b) => {
        if (sortBy === 'Highest Score' || sortBy === 'Priority') return b.currentScore - a.currentScore;
        if (sortBy === 'Lowest Score') return a.currentScore - b.currentScore;
        if (sortBy === 'Newest') return new Date(b.submissionTime).getTime() - new Date(a.submissionTime).getTime();
        if (sortBy === 'Longest Uncontacted') return b.hoursUncontacted - a.hoursUncontacted;
        return 0;
      });
  }, [leads, search, statusFilter, placementFilter, audienceFilter, scoreRange, sortBy]);

  const handleContacted = (id: string) => {
    updateLead(id, { contacted: true });
    if (selectedLead?.id === id) {
      setSelectedLead({ ...selectedLead, contacted: true });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-status-hot';
    if (score >= 40) return 'bg-status-warm';
    return 'bg-status-cold';
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-text-secondary">{stat.title}</span>
                <div className={`p-2 rounded-lg bg-background-elevated border border-border ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className={`text-[28px] md:text-[34px] font-semibold leading-none ${stat.color === 'text-status-hot' ? 'text-status-hot' : 'text-text-primary'}`}>
                  {stat.value}
                </span>
                <span className="text-xs text-text-muted">{stat.indicator}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Priority Lead Queue */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-text-primary">Priority Leads</h2>
          <p className="text-sm text-text-muted mt-1">Leads ranked by current priority</p>
        </div>

        {/* Toolbar */}
        <div className="bg-background-card border border-border rounded-xl p-4 flex flex-col xl:flex-row gap-4 items-center justify-between">
          <div className="relative w-full xl:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input-bg border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-input-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="All">All Status</option>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
            
            <select 
              value={placementFilter}
              onChange={(e) => setPlacementFilter(e.target.value)}
              className="bg-input-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="All">All Placements</option>
              <option value="Reels">Reels</option>
              <option value="Stories">Stories</option>
              <option value="Feed">Feed</option>
              <option value="Audience Network">Audience Network</option>
              <option value="Marketplace">Marketplace</option>
            </select>

            <select 
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="bg-input-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="All">All Audiences</option>
              <option value="1% Lookalike">1% Lookalike</option>
              <option value="Lookalike">Lookalike</option>
              <option value="Retargeting">Retargeting</option>
              <option value="Broad">Broad</option>
            </select>

            <div className="flex items-center gap-2 px-3">
              <span className="text-xs text-text-muted">Min Score: {scoreRange}</span>
              <input 
                type="range" 
                min="0" max="100" 
                value={scoreRange}
                onChange={(e) => setScoreRange(Number(e.target.value))}
                className="w-24 accent-primary"
              />
            </div>
            
            <div className="h-6 w-px bg-border hidden xl:block" />

            <div className="flex items-center gap-2 ml-auto xl:ml-0">
              <ArrowUpDown className="w-4 h-4 text-text-muted" />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm font-medium text-text-primary focus:outline-none cursor-pointer"
              >
                <option>Priority</option>
                <option>Highest Score</option>
                <option>Lowest Score</option>
                <option>Newest</option>
                <option>Longest Uncontacted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Priority Table */}
        <div className="bg-background-card border border-border rounded-xl overflow-x-auto shadow-md">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border text-xs text-text-muted bg-background-elevated/50">
                <th className="px-6 py-4 font-medium">Lead</th>
                <th className="px-6 py-4 font-medium">Source</th>
                <th className="px-6 py-4 font-medium">Placement</th>
                <th className="px-6 py-4 font-medium">Lead Score</th>
                <th className="px-6 py-4 font-medium">Probability</th>
                <th className="px-6 py-4 font-medium">Time Uncontacted</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  onClick={() => setSelectedLead(lead)}
                  className="hover:bg-hover-bg transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-sm text-text-primary">{lead.name}</div>
                    <div className="text-xs text-text-muted mt-0.5">{lead.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{lead.leadSource}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{lead.placement}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{lead.currentScore}</span>
                      <div className="w-16 h-1.5 bg-background-primary rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${getScoreColor(lead.currentScore)}`}
                          style={{ width: `${lead.currentScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium">{lead.conversionProbability}%</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{lead.hoursUncontacted} hrs</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-6 py-4">
                    <ConfidenceBadge confidence={lead.confidence} />
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-text-muted">
                    No leads found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LeadInspector 
        lead={selectedLead} 
        onClose={() => setSelectedLead(null)} 
        onContacted={handleContacted}
      />
    </div>
  );
};
