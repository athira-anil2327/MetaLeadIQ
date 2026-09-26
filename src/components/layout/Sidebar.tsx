import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Lightbulb, 
  Settings,
  Hexagon,
  MessageSquare,
  UploadCloud
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads Queue', icon: Users },
  { id: 'inbox', label: 'Unified Inbox', icon: MessageSquare },
  { id: 'ingestion-guide', label: 'Ingestion Guide', icon: UploadCloud },
  { id: 'campaign-analytics', label: 'Campaign Analytics', icon: BarChart3 },
  { id: 'lead-insights', label: 'Lead Insights', icon: Lightbulb },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen, setIsOpen }) => {
  

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background-primary/80 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-30 h-screen w-[240px] flex flex-col bg-background-secondary border-r border-border transition-transform duration-300 overflow-hidden",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Decorative background element */}
        <div className="absolute inset-0 bg-wave-pattern opacity-[0.15] mix-blend-overlay pointer-events-none" />
        
        <div className="p-6 flex items-center gap-3 relative z-10">
          <Hexagon className="text-primary w-8 h-8 fill-primary/20" strokeWidth={1.5} />
          <span className="font-semibold text-lg tracking-wide">METALEADIQ</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 relative z-10">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActivePage(item.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                activePage === item.id 
                  ? "bg-hover-bg text-primary" 
                  : "text-text-secondary hover:bg-hover-bg/50 hover:text-text-primary"
              )}
            >
              <item.icon className={cn("w-5 h-5", activePage === item.id ? "text-primary" : "text-text-muted")} />
              {item.label}
              {activePage === item.id && (
                <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-border mt-auto relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-background-elevated border border-border flex items-center justify-center text-primary font-medium">
              AM
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium">Angelin Mathew</span>
              <span className="text-xs text-text-muted">Sales Manager</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
