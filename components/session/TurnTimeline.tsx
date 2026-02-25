'use client';

import React from 'react';
import { TurnCard } from './TurnCard';

interface TurnTimelineProps {
  turns: any[];
  onInspect: (turn: any) => void;
}

export const TurnTimeline: React.FC<TurnTimelineProps> = ({ turns, onInspect }) => {
  return (
    <div className="space-y-6">
      {turns.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 font-mono text-sm uppercase tracking-widest border border-dashed border-zinc-800 rounded-lg">
          No turns recorded for this session.
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line connector */}
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-zinc-800" />
          
          <div className="space-y-4">
            {turns.map((turn) => (
              <TurnCard key={turn.id} turn={turn} onInspect={onInspect} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
