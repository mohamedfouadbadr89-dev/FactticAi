'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div 
      className="relative flex items-center" 
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      ref={triggerRef}
    >
      {/* Trigger */}
      {children || <Info className="w-3.5 h-3.5 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-help" />}

      {/* Tooltip Popup */}
      {isVisible && (
        <div 
          className={`absolute z-50 w-64 p-3 text-xs bg-[var(--card-bg)] border border-[var(--border-primary)] shadow-xl rounded-xl text-[var(--text-primary)] font-medium leading-relaxed animate-[fadeIn_.2s_ease-out]
          ${side === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : ''}
          ${side === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' : ''}
          ${side === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' : ''}
          ${side === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' : ''}
          `}
        >
          {content}
          
          {/* Arrow */}
          <div className={`absolute w-2 h-2 bg-[var(--card-bg)] border-[var(--border-primary)] transform rotate-45
            ${side === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b' : ''}
            ${side === 'right' ? 'left-[-5px] top-1/2 -translate-y-1/2 border-l border-b' : ''}
            ${side === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-l border-t' : ''}
            ${side === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-r border-t' : ''}
          `} />
        </div>
      )}
    </div>
  );
}
