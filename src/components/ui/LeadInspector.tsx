import React from 'react';
import { X, Mail, Target, CheckCircle2, Activity } from 'lucide-react';
import type { Lead } from '../../data/mockData';
import { Button } from './Button';
import { StatusBadge, ConfidenceBadge } from './Badge';
import { cn } from '../../lib/utils';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';

interface LeadInspectorProps {
  lead: Lead | null;
  onClose: () => void;
  onContacted: (id: string) => void;
}

export const LeadInspector: React.FC<LeadInspectorProps> = ({ lead, onClose, onContacted }) => {
  if (!lead) return null;

  // Deterministic exponential time decay: S(t) = S_0 * exp(-lambda * t), half_life = 24h
  const timeData = React.useMemo(() => {
    const lambda = 0.028881; // Math.log(2) / 24
    const intervals = [
      { time: '0h', hours: 0 },
      { time: '2h', hours: 2 },
      { time: '6h', hours: 6 },
      { time: '12h', hours: 12 },
      { time: '24h', hours: 24 },
      { time: '48h', hours: 48 },
      { time: '72h', hours: 72 },
    ];
    return intervals.map((intv) => ({
      time: intv.time,
      score: Math.round(lead.baseScore * Math.exp(-lambda * intv.hours)),
    }));
  }, [lead.baseScore]);

  return (
    <>
      <div 
        className="fixed inset-0 bg-background-primary/50 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className={cn(
        "fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-background-elevated border-l border-border shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out overflow-hidden",
        lead ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-background-card">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">{lead.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-text-muted">
              <span>{lead.leadSource} {lead.placement}</span>
              <span>•</span>
              <span>{lead.audienceType}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-background-primary rounded-full text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Top Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background-card border border-border p-5 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-text-secondary mb-1">Lead Score</span>
              <span className="text-4xl font-bold text-primary">{lead.currentScore} <span className="text-lg text-text-muted font-medium">/ 100</span></span>
            </div>
            <div className="bg-background-card border border-border p-5 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-text-secondary mb-1">Probability</span>
              <span className="text-4xl font-bold text-text-primary">{lead.conversionProbability}%</span>
            </div>
          </div>
          
          {/* Status & Confidence */}
          <div className="flex flex-wrap gap-4 items-center p-4 bg-background-card border border-border rounded-xl">
            <div className="flex-1">
              <span className="text-xs text-text-muted block mb-1">Status</span>
              <StatusBadge status={lead.status} className="text-sm px-3 py-1" />
            </div>
            <div className="flex-1 border-l border-border pl-4">
              <span className="text-xs text-text-muted block mb-1">Confidence</span>
              <ConfidenceBadge confidence={lead.confidence} className="text-sm px-3 py-1" />
            </div>
            <div className="flex-1 border-l border-border pl-4">
              <span className="text-xs text-text-muted block mb-1">Time Uncontacted</span>
              <span className="text-sm font-medium">{lead.hoursUncontacted} hours</span>
            </div>
          </div>

          {/* Lead Quality Journey */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-primary" />
              Lead Quality Over Time
            </h3>
            <div className="bg-background-card border border-border rounded-xl p-4 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--color-primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="rgb(var(--color-primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--border-color))', borderRadius: '8px' }}
                    itemStyle={{ color: 'rgb(var(--text-primary))' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="rgb(var(--color-primary))" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Prediction Confidence Range */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Prediction Confidence</h3>
            <div className="bg-background-card border border-border rounded-xl p-5">
              <div className="flex justify-between text-xs text-text-muted mb-2">
                <span>{lead.predictionLower}%</span>
                <span>{lead.predictionUpper}%</span>
              </div>
              <div className="relative h-2 bg-background-primary rounded-full overflow-hidden">
                <div 
                  className="absolute h-full bg-border rounded-full"
                  style={{ left: `${lead.predictionLower}%`, width: `${lead.predictionUpper - lead.predictionLower}%` }}
                />
                <div 
                  className="absolute h-3 w-3 bg-primary rounded-full top-1/2 -translate-y-1/2 -ml-1.5 shadow-[0_0_8px_rgba(200,164,90,0.5)]"
                  style={{ left: `${lead.conversionProbability}%` }}
                />
              </div>
              <div className="text-center mt-3 text-xs font-medium text-text-secondary">
                Model Range: {lead.predictionLower}% — {lead.predictionUpper}%
              </div>
            </div>
          </div>

          {/* Lead Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4 bg-background-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-2 border-b border-border pb-2">Lead Information</h3>
              <div>
                <span className="text-[11px] text-text-muted block mb-0.5">Email</span>
                <span className="text-sm font-medium break-all">{lead.email}</span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted block mb-0.5">Phone</span>
                <span className="text-sm font-medium">{lead.phone}</span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted block mb-0.5">Source / Origin</span>
                <span className="text-sm font-medium">{lead.leadSource} / {lead.leadOrigin}</span>
              </div>
            </div>

            {/* Engagement */}
            <div className="space-y-4 bg-background-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-2 border-b border-border pb-2">Engagement Signals</h3>
              <div>
                <span className="text-[11px] text-text-muted block mb-0.5">Total Visits</span>
                <span className="text-sm font-medium">{lead.totalVisits}</span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted block mb-0.5">Time on Website</span>
                <span className="text-sm font-medium">{lead.timeOnWebsite}m</span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted block mb-0.5">Last Activity</span>
                <span className="text-sm font-medium">{lead.lastActivity}</span>
              </div>
            </div>
          </div>

          {/* Meta Campaign */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center">
              <Target className="w-4 h-4 mr-2 text-primary" />
              Meta Campaign
            </h3>
            <div className="bg-background-card border border-border rounded-xl p-5">
              <div className="grid grid-cols-3 gap-y-4">
                <div>
                  <span className="text-[11px] text-text-muted block mb-0.5">Platform</span>
                  <span className="text-sm font-medium">{lead.leadSource}</span>
                </div>
                <div>
                  <span className="text-[11px] text-text-muted block mb-0.5">Placement</span>
                  <span className="text-sm font-medium">{lead.placement}</span>
                </div>
                <div>
                  <span className="text-[11px] text-text-muted block mb-0.5">Creative</span>
                  <span className="text-sm font-medium">{lead.creativeType}</span>
                </div>
                <div>
                  <span className="text-[11px] text-text-muted block mb-0.5">Audience</span>
                  <span className="text-sm font-medium">{lead.audienceType}</span>
                </div>
                <div>
                  <span className="text-[11px] text-text-muted block mb-0.5">CTR</span>
                  <span className="text-sm font-medium">{lead.ctr}%</span>
                </div>
                <div>
                  <span className="text-[11px] text-text-muted block mb-0.5">CPC</span>
                  <span className="text-sm font-medium">${(lead.cpc ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-6"></div> {/* Spacer */}
        </div>
        
        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-background-card mt-auto flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => {
              if (lead.email) {
                window.location.href = `mailto:${lead.email}?subject=MetaLeadIQ Follow-up`;
              }
            }}
          >
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button 
            className="flex-1"
            disabled={lead.contacted}
            onClick={() => onContacted(lead.id)}
          >
            {lead.contacted ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Contacted
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Contacted
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};
