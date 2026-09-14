import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Target, Users, Layout, MousePointer2 } from 'lucide-react';

export const LeadInsights: React.FC = () => {
  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-text-primary">Lead Insights</h2>
        <p className="text-sm text-text-muted mt-1">Understanding characteristics and engagement signals of the lead dataset.</p>
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
                  <span className="text-xl font-semibold text-text-primary">4.2</span>
                </div>
                <div className="bg-background-elevated p-4 rounded-lg border border-border">
                  <span className="text-xs text-text-muted block mb-1">Avg Time Spent</span>
                  <span className="text-xl font-semibold text-text-primary">12m 45s</span>
                </div>
                <div className="bg-background-elevated p-4 rounded-lg border border-border">
                  <span className="text-xs text-text-muted block mb-1">Avg Page Views</span>
                  <span className="text-xl font-semibold text-text-primary">6.8</span>
                </div>
                <div className="bg-background-elevated p-4 rounded-lg border border-border">
                  <span className="text-xs text-text-muted block mb-1">Form Behaviour</span>
                  <span className="text-lg font-medium text-text-primary">Auto-fill Used</span>
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
              {[
                { origin: 'Landing Page', value: '54%', count: 4210 },
                { origin: 'Lead Form (Native)', value: '28%', count: 2180 },
                { origin: 'Messenger', value: '12%', count: 935 },
                { origin: 'Direct Message', value: '6%', count: 467 },
              ].map((item, i) => (
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
              <CardTitle>Audience Types</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary">45%</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-text-primary">Lookalike Audiences</h4>
                  <p className="text-xs text-text-muted mt-1">1-5% Lookalikes generate the highest quality leads overall.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-16 h-16 rounded-full border-4 border-primary-soft/20 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary-soft">35%</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-text-primary">Retargeting</h4>
                  <p className="text-xs text-text-muted mt-1">Website visitors and video viewers.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-16 h-16 rounded-full border-4 border-border flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-text-muted">20%</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-text-primary">Broad / Interest</h4>
                  <p className="text-xs text-text-muted mt-1">Lowest conversion rate but highest volume.</p>
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
                  <span className="text-sm font-semibold text-text-primary">3.2%</span>
                </div>
                <div className="w-full bg-background-elevated h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[65%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-text-secondary">Average CPC (Cost per Click)</span>
                  <span className="text-sm font-semibold text-text-primary">$1.42</span>
                </div>
                <div className="w-full bg-background-elevated h-2 rounded-full overflow-hidden">
                  <div className="bg-primary-soft h-full w-[40%]" />
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Top Placements</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-background-elevated border border-border rounded-full text-xs text-text-primary">Instagram Reels</span>
                  <span className="px-3 py-1 bg-background-elevated border border-border rounded-full text-xs text-text-primary">Facebook Feed</span>
                  <span className="px-3 py-1 bg-background-elevated border border-border rounded-full text-xs text-text-primary">Instagram Stories</span>
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
