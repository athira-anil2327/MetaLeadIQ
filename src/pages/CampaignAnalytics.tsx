import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ScatterChart, Scatter, ZAxis } from 'recharts';
import { useAppContext } from '../context/AppContext';

export const CampaignAnalytics: React.FC = () => {
  const { leads } = useAppContext();

  // 1. Compute dynamic summary statistics
  const stats = useMemo(() => {
    if (leads.length === 0) {
      return { total: '0', avgConv: '0%', avgCpc: '$0.00', avgCtr: '0.0%' };
    }
    const total = leads.length;
    
    // Avg Conversion Probability as a proxy for conversion rate
    const avgProbability = Math.round(leads.reduce((acc, l) => acc + l.conversionProbability, 0) / total);
    
    // Avg CPC
    const avgCpc = (leads.reduce((acc, l) => acc + l.cpc, 0) / total).toFixed(2);
    
    // Avg CTR
    const avgCtr = (leads.reduce((acc, l) => acc + l.ctr, 0) / total).toFixed(1);
    
    return {
      total: total.toLocaleString(),
      avgConv: `${avgProbability}%`,
      avgCpc: `$${avgCpc}`,
      avgCtr: `${avgCtr}%`,
    };
  }, [leads]);

  // 2. Compute dynamic placement-based metrics
  const placementData = useMemo(() => {
    const groups: { [key: string]: { leads: number; totalScore: number; totalProb: number } } = {};
    
    leads.forEach((lead) => {
      const p = lead.placement || 'Other';
      if (!groups[p]) {
        groups[p] = { leads: 0, totalScore: 0, totalProb: 0 };
      }
      groups[p].leads += 1;
      groups[p].totalScore += lead.currentScore;
      groups[p].totalProb += lead.conversionProbability;
    });

    return Object.entries(groups).map(([name, data]) => {
      // Map names to clean reader-friendly formats
      const cleanName = name
        .replace('Facebook_Feed', 'Facebook Feed')
        .replace('Instagram_Stories', 'Instagram Stories')
        .replace('Instagram_Reels', 'Instagram Reels')
        .replace('Audience_Network', 'Audience Network');
        
      return {
        name: cleanName,
        leads: data.leads,
        avgScore: Math.round(data.totalScore / data.leads),
        conversionRate: Math.round(data.totalProb / data.leads), // Conversion probability as CR
      };
    }).sort((a, b) => b.leads - a.leads);
  }, [leads]);

  // 3. Compute response time (hours uncontacted) impact on conversion probability
  const responseTimeData = useMemo(() => {
    // Bin hours uncontacted to plot scatter/trend
    const bins = [
      { maxHours: 2, label: 1 },
      { maxHours: 6, label: 6 },
      { maxHours: 12, label: 12 },
      { maxHours: 24, label: 24 },
      { maxHours: 48, label: 48 },
      { maxHours: 72, label: 72 },
      { maxHours: 999, label: 96 }
    ];

    const binCounts = bins.map(() => ({ sum: 0, count: 0 }));

    leads.forEach((lead) => {
      const hours = lead.hoursUncontacted;
      for (let i = 0; i < bins.length; i++) {
        if (hours <= bins[i].maxHours) {
          binCounts[i].sum += lead.conversionProbability;
          binCounts[i].count += 1;
          break;
        }
      }
    });

    return bins.map((bin, i) => {
      const count = binCounts[i].count;
      const avgRate = count > 0 ? Math.round(binCounts[i].sum / count) : 0;
      return {
        time: bin.label,
        rate: avgRate
      };
    }).filter(d => d.rate > 0);
  }, [leads]);

  // 4. Compute conversion funnel dynamically
  const funnelStages = useMemo(() => {
    const total = leads.length;
    // Qualified: base score >= 50
    const qualified = leads.filter(l => l.baseScore >= 50).length;
    // Contacted: user flagged as contacted
    const contacted = leads.filter(l => l.contacted).length;
    // Converted: Hot status leads
    const converted = leads.filter(l => l.status === 'Hot').length;

    // Percentages for width styling
    const qualifiedPct = total > 0 ? Math.round((qualified / total) * 100) : 0;
    const contactedPct = total > 0 ? Math.round((contacted / total) * 100) : 0;
    const convertedPct = total > 0 ? Math.round((converted / total) * 100) : 0;

    return [
      { label: 'All Leads', value: total.toLocaleString(), width: '100%', color: 'bg-primary-soft' },
      { label: 'Qualified (Score >= 50)', value: qualified.toLocaleString(), width: `${Math.max(qualifiedPct, 15)}%`, color: 'bg-primary' },
      { label: 'Contacted (Actions Taken)', value: contacted.toLocaleString(), width: `${Math.max(contactedPct, 15)}%`, color: 'bg-primary-bright' },
      { label: 'Converted (Hot Leads Target)', value: converted.toLocaleString(), width: `${Math.max(convertedPct, 15)}%`, color: 'bg-primary' },
    ];
  }, [leads]);

  // 5. Compute lead quality distribution percentage
  const qualityDistribution = useMemo(() => {
    const total = leads.length;
    if (total === 0) return { hot: '0%', warm: '0%', cold: '0%' };

    const hot = leads.filter(l => l.status === 'Hot').length;
    const warm = leads.filter(l => l.status === 'Warm').length;
    const cold = leads.filter(l => l.status === 'Cold').length;

    return {
      hot: `${Math.round((hot / total) * 100)}%`,
      warm: `${Math.round((warm / total) * 100)}%`,
      cold: `${Math.round((cold / total) * 100)}%`,
    };
  }, [leads]);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-text-primary">Campaign Analytics</h2>
        <p className="text-sm text-text-muted mt-1">Analyze lead performance across Meta placements in real-time.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Campaign Leads', value: stats.total },
          { label: 'Avg Conversion Probability', value: stats.avgConv },
          { label: 'Average CPC', value: stats.avgCpc },
          { label: 'Average CTR', value: stats.avgCtr },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <span className="text-sm font-medium text-text-secondary mb-2 block">{stat.label}</span>
              <span className="text-2xl font-semibold text-primary">{stat.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Conversion Rate by Placement */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate by Placement (%)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={placementData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgb(var(--chart-grid))" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--border-color))', borderRadius: '8px' }}
                />
                <Bar dataKey="conversionRate" fill="rgb(var(--color-primary))" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CHART 2: Lead Volume by Placement */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Volume by Placement</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={placementData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--chart-grid))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--border-color))', borderRadius: '8px' }}
                />
                <Bar dataKey="leads" fill="rgb(var(--color-primary-soft))" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CHART 3: Avg Lead Score by Placement */}
        <Card>
          <CardHeader>
            <CardTitle>Average Lead Score by Placement</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={placementData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgb(var(--chart-grid))" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--border-color))', borderRadius: '8px' }}
                />
                <Bar dataKey="avgScore" fill="rgb(var(--color-primary-bright))" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CHART 4: Response Time Impact (Time Decay visualization) */}
        <Card>
          <CardHeader>
            <CardTitle>Response Time Impact (Score Decay)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--chart-grid))" />
                <XAxis dataKey="time" name="Hours Uncontacted" unit="h" type="number" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))' }} />
                <YAxis dataKey="rate" name="Avg Conversion Prob" unit="%" type="number" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))' }} />
                <ZAxis range={[60, 60]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--border-color))', borderRadius: '8px' }}
                />
                <Scatter name="Conversion Probability" data={responseTimeData} fill="rgb(var(--color-primary))" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Funnels & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Conversion Funnel */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Conversion Funnel (Dynamic)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center py-8">
            <div className="w-full max-w-sm space-y-4">
              {funnelStages.map((stage, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="flex justify-between w-full text-xs text-text-secondary mb-1">
                    <span>{stage.label}</span>
                    <span className="font-medium">{stage.value}</span>
                  </div>
                  <div className="w-full bg-background-elevated h-8 rounded overflow-hidden flex justify-start">
                    <div className={`${stage.color} h-full transition-all duration-1000 ease-out`} style={{ width: stage.width }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lead Quality Distribution */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Lead Quality Distribution (Dynamic)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center py-8">
            <div className="space-y-6">
              {[
                { label: 'Hot', value: qualityDistribution.hot, color: 'bg-status-hot', barColor: 'bg-status-hot/20' },
                { label: 'Warm', value: qualityDistribution.warm, color: 'bg-status-warm', barColor: 'bg-status-warm/20' },
                { label: 'Cold', value: qualityDistribution.cold, color: 'bg-status-cold', barColor: 'bg-status-cold/20' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">{item.label}</span>
                    <span className="text-sm text-text-secondary">{item.value}</span>
                  </div>
                  <div className={`w-full h-3 rounded-full ${item.barColor} overflow-hidden`}>
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: item.value }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
