import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAppContext } from '../context/AppContext';
import { Moon, Sun } from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useAppContext();

  return (
    <div className="p-6 md:p-8 max-w-[800px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-text-primary">Settings</h2>
        <p className="text-sm text-text-muted mt-1">Manage your dashboard preferences and appearance.</p>
      </div>

      <div className="space-y-6">
        
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
              <select className="bg-input-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary min-w-[160px]">
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
              <select className="bg-input-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary min-w-[160px]">
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
                <p className="text-xs text-text-muted mt-1">Get notified when a lead scores 80 or above.</p>
              </div>
              <div className="relative inline-block w-10 h-6 rounded-full bg-primary transition-colors cursor-pointer">
                <span className="absolute top-1 left-5 w-4 h-4 bg-background-primary rounded-full transition-transform" />
              </div>
            </div>
            
            <div className="h-px bg-border w-full" />
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-text-primary">Uncontacted Warnings</h4>
                <p className="text-xs text-text-muted mt-1">Alert when a Hot lead is uncontacted for &gt; 4 hours.</p>
              </div>
              <div className="relative inline-block w-10 h-6 rounded-full bg-primary transition-colors cursor-pointer">
                <span className="absolute top-1 left-5 w-4 h-4 bg-background-primary rounded-full transition-transform" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
