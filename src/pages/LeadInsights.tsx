import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Target, Users, Layout, MousePointer2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const LeadInsights: React.FC = () => {
  const { leads } = useAppContext();

  const insights = useMemo(() => {
    const total = leads.length || 1;

    // Engagement Averages
    const avgVisits = (leads.reduce((acc, l) => acc + (l.totalVisits || 0), 0) / total).toFixed(1);
    const avgTimeMin = leads.reduce((acc, l) => acc + (l.timeOnWebsite || 0), 0) / total;
    const mins = Math.floor(avgTimeMin);
    const secs = Math.round((avgTimeMin - mins) * 60);
    const avgTimeFormatted = `${mins}m ${secs}s`;
    const avgPages = (leads.reduce((acc, l) => acc + (l.pageViews || 0), 0) / total).toFixed(1);

    // Lead Origin Breakdown
    const originCounts: Record<string, number> = {};
    leads.forEach((l) => {
      const orig = l.leadOrigin || 'Unknown';
      originCounts[orig] = (originCounts[orig] || 0) + 1;
    });
    const originsList = Object.entries(originCounts)
      .map(([origin, count]) => ({
        origin,
        count,
        value: `${Math.round((count / total) * 100)}%`,
      }))
      .sort((a, b) => b.count - a.count);

    // Audience Breakdown
    const audienceCounts: Record<string, number> = {};
    leads.forEach((l) => {
      const aud = l.audienceType || 'Broad';
      audienceCounts[aud] = (audienceCounts[aud] || 0) + 1;
    });
    const audLookalike = Math.round(((audienceCounts['1% Lookalike'] || audienceCounts['Lookalike'] || 0) / total) * 100);
    const audRetargeting = Math.round(((audienceCounts['Retargeting'] || 0) / total) * 100);
    const audBroad = Math.max(0, 100 - audLookalike - audRetargeting);

    // Ad Metrics
    const avgCtr = (leads.reduce((acc, l) => acc + (l.ctr || 0), 0) / total).toFixed(1);
    const avgCpc = (leads.reduce((acc, l) => acc + (l.cpc || 0), 0) / total).toFixed(2);

    // Top Placements
    const placementCounts: Record<string, number> = {};
    leads.forEach((l) => {
      const pl = l.placement || 'Feed';
      placementCounts[pl] = (placementCounts[pl] || 0) + 1;
    });
    const topPlacements = Object.entries(placementCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([pl]) => pl)
      .slice(0, 4);

    return {
      avgVisits,
      avgTimeFormatted,
      avgPages,
      originsList,
      audLookalike,
      audRetargeting,
      audBroad,
      avgCtr,
      avgCpc,
      topPlacements,
    };
  }, [leads]);

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-text-primary">Lead Insights</h2>
        <p className="text-sm text-text-muted mt-1">
          Dynamic machine-learning and engagement characteristics from your active lead queue ({leads.length} leads).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Engagement Signals */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MousePointer2 className="w-5 h-5 text-primary" />
              <CardTitle>Engagement Signals</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background-elevated p-4 rounded-lg border border-border">
                  <span className="text-xs text-text-muted block mb-1">Avg Total Visits</span>
                  <span className="text-xl font-semibold text-text-primary">{insights.avgVisits}</span>
                </div>
                <div className="bg-background-elevated p-4 rounded-lg border border-border">
                  <span className="text-xs text-text-muted block mb-1">Avg Time Spent</span>
                  <span className="text-xl font-semibold text-text-primary">{insights.avgTimeFormatted}</span>
                </div>
                <div className="bg-background-elevated p-4 rounded-lg border border-border">
                  <span className="text-xs text-text-muted block mb-1">Avg Page Views</span>
                  <span className="text-xl font-semibold text-text-primary">{insights.avgPages}</span>
                </div>
                <div className="bg-background-elevated p-4 rounded-lg border border-border">
                  <span className="text-xs text-text-muted block mb-1">High Intent Lead Share</span>
                  <span className="text-lg font-medium text-text-primary">
                    {Math.round((leads.filter(l => l.status === 'Hot').length / (leads.length || 1)) * 100)}% Hot
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Origins */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layout className="w-5 h-5 text-primary" />
              <CardTitle>Lead Origin Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.originsList.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-text-primary block">{item.origin}</span>
                    <span className="text-xs text-text-muted">{item.count} leads</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-primary">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audience Profiles */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>Audience Breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary">{insights.audLookalike}%</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-text-primary">Lookalike Audiences</h4>
                  <p className="text-xs text-text-muted mt-1">High-similarity prospects identified through Meta Lookalike expansion.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-16 h-16 rounded-full border-4 border-primary-soft/20 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary-soft">{insights.audRetargeting}%</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-text-primary">Retargeting</h4>
                  <p className="text-xs text-text-muted mt-1">Prior video watchers and page visitors.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-16 h-16 rounded-full border-4 border-border flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-text-muted">{insights.audBroad}%</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-text-primary">Broad / Interest</h4>
                  <p className="text-xs text-text-muted mt-1">Broad ad placement reach filtered by the XGBoost priority ranker.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ad Performance Context */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <CardTitle>Meta Performance Context</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-text-secondary">Average CTR (Click-Through)</span>
                  <span className="text-sm font-semibold text-text-primary">{insights.avgCtr}%</span>
                </div>
                <div className="w-full bg-background-elevated h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, parseFloat(insights.avgCtr) * 15)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-text-secondary">Average CPC (Cost per Click)</span>
                  <span className="text-sm font-semibold text-text-primary">${insights.avgCpc}</span>
                </div>
                <div className="w-full bg-background-elevated h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-soft h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (parseFloat(insights.avgCpc) / 5) * 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Top Placements</h4>
                <div className="flex flex-wrap gap-2">
                  {insights.topPlacements.map((pl, idx) => (
                    <span key={idx} className="px-3 py-1 bg-background-elevated border border-border rounded-full text-xs text-text-primary">
                      {pl}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ML Pipeline Visualization */}
      <Card className="col-span-1 md:col-span-2 mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            <CardTitle>ML Lead Scoring Pipeline (6 Steps)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[45px] left-8 right-8 h-0.5 bg-border -z-10" />
            
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-background-elevated border-2 border-primary flex items-center justify-center mb-3">
                  <span className="font-bold text-primary">1</span>
                </div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">Feature Pruning</h4>
                <p className="text-xs text-text-muted">SHAP library computes Shapley values to identify the top 42 most impactful predictive features.</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-background-elevated border-2 border-primary flex items-center justify-center mb-3">
                  <span className="font-bold text-primary">2</span>
                </div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">XGBoost Model</h4>
                <p className="text-xs text-text-muted">Binary logistic classifier trained using Newton-Raphson second-order gradients.</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-background-elevated border-2 border-primary flex items-center justify-center mb-3">
                  <span className="font-bold text-primary">3</span>
                </div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">Platt Scaling</h4>
                <p className="text-xs text-text-muted">CalibratedClassifierCV maps raw tree logits into a true base probability (0 to 1).</p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-background-elevated border-2 border-primary flex items-center justify-center mb-3">
                  <span className="font-bold text-primary">4</span>
                </div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">Time Decay</h4>
                <p className="text-xs text-text-muted">Base score depreciates via exponential decay (-0.0289 * uncontacted hours).</p>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-background-elevated border-2 border-primary flex items-center justify-center mb-3">
                  <span className="font-bold text-primary">5</span>
                </div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">Wald 95% C.I.</h4>
                <p className="text-xs text-text-muted">Margin of error calculated factoring in target probability and Total Visits.</p>
              </div>

              {/* Step 6 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-background-elevated border-2 border-primary flex items-center justify-center mb-3">
                  <span className="font-bold text-primary">6</span>
                </div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">Lexicographic Queue</h4>
                <p className="text-xs text-text-muted">Leads are dynamically sorted by Decayed Score (DESC), followed by CPC (ASC).</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
