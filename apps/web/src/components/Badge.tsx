import React from 'react';

interface BadgeProps {
  variant?: 'draft' | 'published' | 'archived' | 'category' | 'role';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'category', children, className = '' }) => {
  const getStyles = () => {
    switch (variant) {
      case 'published':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'draft':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'archived':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'role':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'category':
      default:
        return 'bg-amber-50/80 text-amber-800 border-amber-200/60';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles()} ${className}`}
    >
      {children}
    </span>
  );
};
