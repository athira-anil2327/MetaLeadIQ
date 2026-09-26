import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAppContext } from '../context/AppContext';
import { Moon, Sun, Server } from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, toggleTheme, isLiveBackend, refreshLeads, leads } = useAppContext();

  const [hotLeadAlerts, setHotLeadAlerts] = useState<boolean>(() => {
    return localStorage.getItem('metaleadiq_hot_alerts') !== 'false';
  });

  const [uncontactedAlerts, setUncontactedAlerts] = useState<boolean>(() => {
    return localStorage.getItem('metaleadiq_uncontacted_alerts') !== 'false';
  });

  const [defaultSort, setDefaultSort] = useState<string>(() => {
    return localStorage.getItem('metaleadiq_default_sort') || 'Priority';
  });

  const [defaultView, setDefaultView] = useState<string>(() => {
    return localStorage.getItem('metaleadiq_default_view') || 'All Leads';
  });

  useEffect(() => {
    localStorage.setItem('metaleadiq_hot_alerts', String(hotLeadAlerts));
  }, [hotLeadAlerts]);

  useEffect(() => {
    localStorage.setItem('metaleadiq_uncontacted_alerts', String(uncontactedAlerts));
  }, [uncontactedAlerts]);

  useEffect(() => {
    localStorage.setItem('metaleadiq_default_sort', defaultSort);
  }, [defaultSort]);

  useEffect(() => {
    localStorage.setItem('metaleadiq_default_view', defaultView);
  }, [defaultView]);

  return (
    <div className="p-6 md:p-8 max-w-[800px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-text-primary">Settings</h2>
        <p className="text-sm text-text-muted mt-1">Manage your dashboard preferences, real-time API connection, and notifications.</p>
      </div>

      <div className="space-y-6">
        
        {/* Backend & Webhook Connection Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              <CardTitle>Production API &amp; Webhook Engine</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-background-elevated border border-border">
              <div className="flex items-center gap-3">
                {isLiveBackend ? (
                  <div className="w-3 h-3 rounded-full bg-status-hot animate-pulse" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-text-muted" />
                )}
                <div>
                  <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    {isLiveBackend ? 'FastAPI Backend Live' : 'Demo Local Mode (Offline API)'}
                    {isLiveBackend && (
                      <span className="text-[11px] bg-status-hot/15 text-status-hot px-2 py-0.5 rounded-full font-medium">
                        Connected (Port 8000)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {isLiveBackend
                      ? `Connected to SQLite persistence engine (${leads.length} leads in database).`
                      : 'Running in frontend standalone mode with pipeline predictions.'}
                  </p>
                </div>
              </div>
              <button
                onClick={refreshLeads}
                className="px-4 py-2 text-xs font-medium bg-background-card border border-border rounded-lg hover:border-primary text-text-primary transition-colors"
              >
                Check Connection
              </button>
            </div>

            <div className="text-xs text-text-muted p-3 bg-background-primary rounded-lg border border-border flex flex-col gap-1">
              <span className="font-medium text-text-secondary">Meta Webhook Endpoint:</span>
              <code className="text-primary select-all">http://localhost:8000/api/webhook/meta</code>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <button 
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`flex-1 flex flex-col items-center justify-center p-6 border rounded-xl transition-all duration-200 ${theme === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background-elevated text-text-secondary hover:border-primary/50'}`}
              >
                <Moon className="w-8 h-8 mb-3" />
                <span className="font-medium">Dark Mode</span>
              </button>
              <button 
                onClick={() => theme !== 'light' && toggleTheme()}
                className={`flex-1 flex flex-col items-center justify-center p-6 border rounded-xl transition-all duration-200 ${theme === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background-elevated text-text-secondary hover:border-primary/50'}`}
              >
                <Sun className="w-8 h-8 mb-3" />
                <span className="font-medium">Light Mode</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-medium text-text-primary">Default Lead Sorting</h4>
                <p className="text-xs text-text-muted mt-1">Choose how leads are sorted when you first open the dashboard.</p>
              </div>
              <select 
                value={defaultSort}
                onChange={(e) => setDefaultSort(e.target.value)}
                className="bg-input-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary min-w-[160px]"
              >
                <option>Priority</option>
                <option>Highest Score</option>
                <option>Newest</option>
              </select>
            </div>
            
            <div className="h-px bg-border w-full" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-medium text-text-primary">Default Lead View</h4>
                <p className="text-xs text-text-muted mt-1">Select the initial filter state for the lead queue.</p>
              </div>
              <select 
                value={defaultView}
                onChange={(e) => setDefaultView(e.target.value)}
                className="bg-input-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary min-w-[160px]"
              >
                <option>All Leads</option>
                <option>Hot Leads Only</option>
                <option>Uncontacted Only</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-text-primary">New Hot Lead Alerts</h4>
                <p className="text-xs text-text-muted mt-1">Get notified when a lead scores 70 or above.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={hotLeadAlerts}
                onClick={() => setHotLeadAlerts(!hotLeadAlerts)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${hotLeadAlerts ? 'bg-primary' : 'bg-background-elevated border-border'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${hotLeadAlerts ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
            
            <div className="h-px bg-border w-full" />
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-text-primary">Uncontacted Warnings</h4>
                <p className="text-xs text-text-muted mt-1">Alert when a Hot lead is uncontacted for &gt; 4 hours.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={uncontactedAlerts}
                onClick={() => setUncontactedAlerts(!uncontactedAlerts)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${uncontactedAlerts ? 'bg-primary' : 'bg-background-elevated border-border'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${uncontactedAlerts ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
