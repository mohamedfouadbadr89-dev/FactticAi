'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, RotateCcw, Activity, AlertTriangle } from 'lucide-react'

interface RiskMarker {
  timestamp_ms: number
  risk_score: number
  label: string
}

interface AudioPlayerProps {
  audioUrl: string
  durationMs: number
  riskMarkers: RiskMarker[]
}

/**
 * Premium Audio Player for Forensic Investigation
 * Features waveform visualization and risk-marker injection.
 */
export function AudioPlayer({ audioUrl, durationMs, riskMarkers }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause()
      else audioRef.current.play()
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - bounds.left
    const percent = Math.max(0, Math.min(1, x / bounds.width))
    if (audioRef.current) {
      audioRef.current.currentTime = percent * (duration || durationMs / 1000)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Generate a deterministic pseudo-random waveform
  const waveform = React.useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      height: 20 + Math.abs(Math.sin(i * 0.2)) * 60 + Math.random() * 20
    }))
  }, [])

  if (!audioUrl) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2rem] p-10 flex flex-col items-center justify-center text-center border-dashed group/empty">
         <AlertTriangle className="w-10 h-10 mb-4 text-[var(--text-secondary)] opacity-20 group-hover/empty:opacity-40 transition-opacity" />
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Audio recording not available</p>
         <p className="text-[9px] text-[var(--text-secondary)] opacity-50 mt-1 uppercase">Evidence restricted or not captured for this session</p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2rem] p-6 space-y-5 shadow-2xl relative overflow-hidden group/player">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Activity className="w-24 h-24 text-[var(--accent)]" />
      </div>

      <audio 
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-5">
          <button 
            onClick={togglePlay}
            className="w-14 h-14 bg-[var(--accent)] text-white rounded-[1.25rem] flex items-center justify-center hover:scale-105 transition-all active:scale-95 shadow-xl shadow-[var(--accent)]/30 group-hover/player:shadow-[var(--accent)]/50"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>
          
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-0.5">Forensic Audio Replay</p>
            <h4 className="text-lg font-black tracking-tight text-[var(--text-primary)]">Voice Integrity Evidence</h4>
          </div>
        </div>

        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] px-4 py-2 rounded-xl flex items-center gap-3 text-[var(--text-secondary)] font-mono text-xs shadow-sm">
          <span className="text-[var(--text-primary)] font-bold">{formatTime(currentTime)}</span>
          <span className="opacity-20 text-lg">/</span>
          <span>{formatTime(duration || durationMs / 1000)}</span>
        </div>
      </div>

      {/* Waveform Visualization Container */}
      <div className="relative h-24 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)] overflow-hidden cursor-pointer group/wave shadow-inner" onClick={seek}>
        {/* Fake Waveform Bars */}
        <div className="absolute inset-0 flex items-center justify-between px-4 gap-[2px]">
          {waveform.map((bar, i) => (
            <div 
              key={i} 
              className="flex-1 bg-[var(--text-secondary)] rounded-full transition-all duration-300 opacity-20"
              style={{ 
                height: `${bar.height}%`,
              }}
            />
          ))}
        </div>

        {/* Animated Progress Overlay */}
        <div 
          className="absolute inset-y-0 left-0 bg-[var(--accent)]/10 border-r-[3px] border-[var(--accent)] flex items-center justify-between overflow-hidden transition-[width] duration-100 ease-linear pointer-events-none"
          style={{ width: `${(currentTime / (duration || durationMs / 1000)) * 100}%` }}
        >
           <div className="flex items-center justify-between w-full h-full px-4 gap-[2px] shrink-0" style={{ width: 'calc(100% / 120 * 120)' }}>
             {waveform.map((bar, i) => (
               <div 
                 key={i} 
                 className="flex-1 bg-[var(--accent)] rounded-full opacity-60"
                 style={{ 
                   height: `${bar.height}%`,
                 }}
               />
             ))}
           </div>
        </div>

        {/* Risk Regions Overlay */}
        <div className="absolute inset-0 pointer-events-none px-4">
          {riskMarkers.map((marker, i) => {
            const percent = (marker.timestamp_ms / durationMs) * 100
            const isCritical = marker.risk_score > 0.7
            return (
              <div 
                key={i}
                className={`absolute top-0 bottom-0 w-[2px] transition-all duration-300 ${isCritical ? 'bg-red-500' : 'bg-orange-500'}`}
                style={{ left: `calc(${percent}% + 16px)` }}
              >
                <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-2 border-[var(--bg-primary)] ${isCritical ? 'bg-red-500' : 'bg-orange-500'}`} />
                <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover/wave:opacity-100 transition-opacity bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md border border-white/10 flex items-center gap-1.5 shadow-xl">
                   <AlertTriangle className={`w-3 h-3 ${isCritical ? 'text-red-500' : 'text-orange-500'}`} />
                   <span className="text-[8px] font-black uppercase text-white whitespace-nowrap tracking-wider">
                     {Math.round(marker.risk_score * 100)}% Breach
                   </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between px-2 pt-2">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1 items-center">
             <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
             <div className="w-1.5 h-1.5 bg-red-500/50 rounded-full" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Heuristic Anomaly markers active</span>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 group-hover/player:text-[var(--accent)] transition-colors">
              <Volume2 className="w-4 h-4 text-[var(--text-secondary)]" />
              <div className="w-12 h-1 bg-[var(--border-primary)] rounded-full overflow-hidden">
                 <div className="h-full bg-[var(--accent)] w-3/4" />
              </div>
           </div>
           <button 
             onClick={() => { if(audioRef.current) audioRef.current.currentTime = 0 }}
             className="p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-all"
           >
             <RotateCcw className="w-4 h-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" />
           </button>
        </div>
      </div>
    </div>
  )
}
