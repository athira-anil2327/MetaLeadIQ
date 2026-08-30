import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ScatterChart, Scatter, ZAxis } from 'recharts';

const placementData = [
  { name: 'Instagram Reels', conversionRate: 12.4, leads: 420, avgScore: 82 },
  { name: 'Instagram Stories', conversionRate: 8.7, leads: 310, avgScore: 74 },
  { name: 'Facebook Feed', conversionRate: 5.2, leads: 540, avgScore: 61 },
  { name: 'Audience Network', conversionRate: 2.1, leads: 180, avgScore: 45 },
];

const responseTimeData = [
  { time: 1, rate: 24.5 },
  { time: 6, rate: 18.2 },
  { time: 12, rate: 12.4 },
  { time: 24, rate: 8.1 },
  { time: 48, rate: 4.3 },
  { time: 72, rate: 1.2 },
];

export const CampaignAnalytics: React.FC = () => {
  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-text-primary">Campaign Analytics</h2>
        <p className="text-sm text-text-muted mt-1">Analyze lead performance across Meta placements.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Campaign Leads', value: '1,450' },
          { label: 'Avg Conversion Rate', value: '6.8%' },
          { label: 'Average CPC', value: '$2.14' },
          { label: 'Average CTR', value: '3.2%' },
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
            <CardTitle>Conversion Rate by Placement</CardTitle>
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

        {/* CHART 4: Response Time Impact */}
        <Card>
          <CardHeader>
            <CardTitle>Response Time Impact</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--chart-grid))" />
                <XAxis dataKey="time" name="Response Time (h)" unit="h" type="number" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))' }} />
                <YAxis dataKey="rate" name="Conversion Rate" unit="%" type="number" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-muted))' }} />
                <ZAxis range={[60, 60]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--border-color))', borderRadius: '8px' }}
                />
                <Scatter name="Conversion" data={responseTimeData} fill="rgb(var(--color-primary))" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Conversion Funnel */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center py-8">
            <div className="w-full max-w-sm space-y-4">
              {[
                { label: 'All Leads', value: '9,240', width: '100%', color: 'bg-primary-soft' },
                { label: 'Qualified', value: '5,820', width: '80%', color: 'bg-primary' },
                { label: 'Contacted', value: '3,410', width: '60%', color: 'bg-primary-bright' },
                { label: 'Converted', value: '1,420', width: '40%', color: 'bg-primary' },
              ].map((stage, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="flex justify-between w-full text-xs text-text-secondary mb-1">
                    <span>{stage.label}</span>
                    <span className="font-medium">{stage.value}</span>
                  </div>
                  <div className="w-full bg-background-elevated h-8 rounded overflow-hidden flex justify-center">
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
            <CardTitle>Lead Quality Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center py-8">
            <div className="space-y-6">
              {[
                { label: 'Hot', value: '19%', color: 'bg-status-hot', barColor: 'bg-status-hot/20' },
                { label: 'Warm', value: '43%', color: 'bg-status-warm', barColor: 'bg-status-warm/20' },
                { label: 'Cold', value: '38%', color: 'bg-status-cold', barColor: 'bg-status-cold/20' },
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
