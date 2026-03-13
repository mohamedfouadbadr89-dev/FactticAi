'use client';

import React, { useState } from 'react';
import { MessageSquarePlus, X, Send, Loader2 } from 'lucide-react';

export default function UserFeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setStatus('sending');
    
    // Simulate API request to save feedback
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setStatus('success');
      setTimeout(() => {
        setIsOpen(false);
        setFeedback('');
        setStatus('idle');
      }, 2000);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center p-3.5 bg-[var(--accent)] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all outline-none focus:ring-4 focus:ring-[var(--accent)]/30 group"
          aria-label="Submit Feedback"
        >
          <MessageSquarePlus className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-bold pl-0 group-hover:pl-2">
            Beta Feedback
          </span>
        </button>
      )}

      {/* Slide-Up Form */}
      {isOpen && (
        <div className="w-80 bg-[var(--card-bg)] border border-[var(--border-primary)] shadow-2xl rounded-2xl overflow-hidden animate-[slideUp_.3s_ease-out]">
          <div className="px-5 py-4 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-secondary)]">
            <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 text-sm uppercase tracking-widest">
              UX Testing Feedback
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5">
            <label className="block text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
              Encountered a bug or have an idea to improve this page? Let the engineering team know.
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Describe the issue or suggestion..."
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-3 text-sm focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none min-h-[100px] resize-none mb-4"
              required
            />
            
            <button
              type="submit"
              disabled={status === 'sending' || status === 'success'}
              className={`w-full flex justify-center items-center py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
                status === 'success' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' :
                status === 'error' ? 'bg-red-500 text-white' :
                'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white'
              }`}
            >
              {status === 'sending' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : status === 'success' ? (
                'Recorded. Thank you!'
              ) : (
                <span className="flex items-center gap-2">Submit <Send className="w-3.5 h-3.5" /></span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
