import React from 'react';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ title, description, actionLabel, onAction, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-[var(--bg-secondary)] border border-dashed border-[var(--border-primary)] rounded-xl ${className}`}>
      
      {/* Subtle Illustration System SVG */}
      <div className="mb-6 opacity-60">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Layer */}
          <circle cx="60" cy="60" r="48" fill="var(--bg-primary)" stroke="var(--border-secondary)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="60" cy="60" r="32" fill="var(--card-bg)" stroke="var(--border-primary)" strokeWidth="2" />
          
          {/* Inner Abstract Geometry — representing neutral data flow */}
          <path d="M48 60 H72 M60 48 V72" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
          <rect x="42" y="42" width="6" height="6" rx="1" fill="var(--border-secondary)" />
          <rect x="72" y="72" width="6" height="6" rx="1" fill="var(--border-secondary)" />
          <circle cx="45" cy="75" r="3" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1" />
          
          {/* Accents */}
          <path d="M75 35 Q90 20 100 30" stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0.4" strokeDasharray="2 2" />
          <circle cx="95" cy="25" r="2" fill="var(--accent)" opacity="0.5" />
        </svg>
      </div>

      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">{title}</h3>
      <p className="text-xs text-[var(--text-secondary)] max-w-sm font-normal leading-relaxed mb-6">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-outline px-5 py-2 text-xs font-medium rounded-lg border border-[var(--border-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-all bg-[var(--card-bg)] shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
