'use client';

import React from 'react';

interface ViewModeToggleProps {
  mode: 'executive' | 'technical';
  onChange: (mode: 'executive' | 'technical') => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="flex bg-zinc-900 p-1 rounded-sm border border-zinc-800">
      <button 
        onClick={() => onChange('executive')}
        className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-tighter transition-all rounded-sm ${
          mode === 'executive' 
            ? 'bg-zinc-100 text-zinc-900' 
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        Executive
      </button>
      <button 
        onClick={() => onChange('technical')}
        className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-tighter transition-all rounded-sm ${
          mode === 'technical' 
            ? 'bg-zinc-100 text-zinc-900' 
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        Technical
      </button>
    </div>
  );
};
