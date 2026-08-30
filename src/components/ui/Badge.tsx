import React from 'react';
import { cn } from '../../lib/utils';
import type { LeadStatus, ConfidenceLevel } from '../../data/mockData';

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const statusStyles = {
    Hot: 'bg-status-hot/10 border-status-hot text-status-hot',
    Warm: 'bg-status-warm/10 border-status-warm text-status-warm',
    Cold: 'bg-status-cold/10 border-status-cold text-status-cold',
  };

  return (
    <span className={cn('px-2.5 py-0.5 rounded text-[11px] font-medium border', statusStyles[status], className)}>
      {status}
    </span>
  );
};

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, className }) => {
  const confidenceStyles = {
    High: 'text-status-success bg-status-success/10',
    Moderate: 'text-primary-soft bg-primary-soft/10',
    Uncertain: 'text-status-uncertain bg-status-uncertain/10',
  };

  return (
    <span className={cn('px-2.5 py-0.5 rounded text-[11px] font-medium', confidenceStyles[confidence], className)}>
      {confidence}
    </span>
  );
};
