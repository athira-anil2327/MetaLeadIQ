import React from 'react';
import { Bell, Menu, Moon, Sun, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAppContext } from '../../context/AppContext';

interface TopHeaderProps {
  title: string;
  subtitle: string;
  onMenuClick: () => void;
  onAddLeadClick: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ title, subtitle, onMenuClick, onAddLeadClick }) => {
  const { theme, toggleTheme } = useAppContext();

  return (
    <header className="flex items-center justify-between py-6 px-6 md:px-8 border-b border-border bg-background-primary sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-text-secondary hover:text-text-primary rounded-md hover:bg-hover-bg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-[28px] font-semibold text-text-primary">{title}</h1>
          <p className="text-sm text-text-muted mt-1">{subtitle}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <button className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-hover-bg transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button 
          onClick={toggleTheme}
          className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-hover-bg transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <Button onClick={onAddLeadClick} className="ml-2">
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>
    </header>
  );
};
