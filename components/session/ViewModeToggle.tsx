'use client';

import React from'react';

interface ViewModeToggleProps {
 mode:'executive' |'technical';
 onChange: (mode:'executive' |'technical') => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ mode, onChange }) => {
 return (
 <div className="flex bg-neutral-100 p-1 rounded-sm border border-neutral-200">
 <button 
 onClick={() => onChange('executive')}
 className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-tighter transition-all rounded-sm ${
 mode ==='executive' 
 ?'' 
 :'text-neutral-500 hover:text-neutral-700'
 }`}
 >
 Executive
 </button>
 <button 
 onClick={() => onChange('technical')}
 className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-tighter transition-all rounded-sm ${
 mode ==='technical' 
 ?'' 
 :'text-neutral-500 hover:text-neutral-700'
 }`}
 >
 Technical
 </button>
 </div>
 );
};
