import React, { type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50';
  
  const variants = {
    primary: 'bg-primary text-background-primary hover:bg-primary-bright',
    secondary: 'bg-background-elevated text-text-primary hover:bg-hover-bg border border-border',
    outline: 'bg-transparent text-primary border border-primary hover:bg-primary/10',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-hover-bg',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};
