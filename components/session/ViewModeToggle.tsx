'use client';

import React from'react';

interface ViewModeToggleProps {
 mode:'executive' |'technical';
 onChange: (mode:'executive' |'technical') => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ mode, onChange }) => {
 return (
 <div className="flex bg-[var(--bg-primary)] p-1 rounded-sm border border-[var(--border-primary)]">
 <button 
 onClick={() => onChange('executive')}
 className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-tighter transition-all rounded-sm ${
 mode ==='executive' 
 ?'' 
 :'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
 }`}
 >
 Executive
 </button>
 <button 
 onClick={() => onChange('technical')}
 className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-tighter transition-all rounded-sm ${
 mode ==='technical' 
 ?'' 
 :'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
 }`}
 >
 Technical
 </button>
 </div>
 );
};
