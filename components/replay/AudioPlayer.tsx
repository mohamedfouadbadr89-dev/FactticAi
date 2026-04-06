"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, SkipBack, SkipForward,
} from "lucide-react";

interface AudioPlayerProps {
  /** Direct URL to a recorded audio file (mp3/wav/ogg/webm).
   *  If omitted the player falls back to Web Speech API TTS
   *  and reads the transcript turns aloud. */
  recordingUrl?: string | null;
  /** Transcript turns used for TTS fallback and timeline sync. */
  transcript?: Array<{ role: string; content: string; timestamp: string }>;
  /** Called with the index of the currently-speaking turn so the parent
   *  can highlight it in the timeline. */
  onTurnChange?: (index: number) => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

function fmt(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ─────────────────────────────────────────────
   SUB-COMPONENT: Real audio file player
───────────────────────────────────────────── */
function FilePlayer({
  url,
  onTurnChange,
  transcript,
}: {
  url: string;
  onTurnChange?: (i: number) => void;
  transcript?: AudioPlayerProps["transcript"];
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(2); // default 1x
  const progressRef = useRef<HTMLDivElement>(null);

  const speed = SPEEDS[speedIdx];

  // Sync playback rate whenever speed changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play().then(() => setPlaying(true)).catch(() => {}); }
  }, [playing]);

  const skip = (delta: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, current + delta));
  };

  // Sync turn highlight
  useEffect(() => {
    if (!transcript || !onTurnChange) return;
    const startMs = transcript[0] ? new Date(transcript[0].timestamp).getTime() : 0;
    const idx = transcript.findLastIndex(
      (t) => (new Date(t.timestamp).getTime() - startMs) / 1000 <= current
    );
    if (idx >= 0) onTurnChange(idx);
  }, [current, transcript, onTurnChange]);

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (audioRef.current) audioRef.current.currentTime = pct * duration;
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-3">
      <audio
        ref={audioRef}
        src={url}
        muted={muted}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
      />

      {/* Progress bar */}
      <div
        ref={progressRef}
        className="relative h-1.5 w-full rounded-full bg-[var(--bg-primary)] cursor-pointer group"
        onClick={seekTo}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] transition-all"
          style={{ width: `${progress}%` }}
        />
        {/* Scrubber thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-[10px] font-mono text-[var(--text-secondary)]">
        <span>{fmt(current)}</span>
        <span>{fmt(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => skip(-10)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Back 10s"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={toggle}
            className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-black hover:opacity-90 transition-opacity"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={() => skip(10)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Forward 10s"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Speed */}
          <button
            onClick={() => setSpeedIdx((i) => (i + 1) % SPEEDS.length)}
            className="text-[10px] font-mono font-bold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors w-8 text-center"
          >
            {speed}x
          </button>

          {/* Mute */}
          <button
            onClick={() => setMuted((m) => !m)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SUB-COMPONENT: TTS fallback player
───────────────────────────────────────────── */
function TtsPlayer({
  transcript,
  onTurnChange,
}: {
  transcript: NonNullable<AudioPlayerProps["transcript"]>;
  onTurnChange?: (i: number) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [turnIdx, setTurnIdx] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(2);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speed = SPEEDS[speedIdx];

  const speak = useCallback(
    (idx: number) => {
      if (!window.speechSynthesis || idx >= transcript.length) {
        setPlaying(false);
        setTurnIdx(0);
        return;
      }
      window.speechSynthesis.cancel();
      const turn = transcript[idx];
      const utt = new SpeechSynthesisUtterance(
        `${turn.role === "assistant" ? "Agent" : "User"}: ${turn.content}`
      );
      utt.rate = speed;
      utt.onend = () => {
        const next = idx + 1;
        setTurnIdx(next);
        onTurnChange?.(next);
        speak(next);
      };
      uttRef.current = utt;
      window.speechSynthesis.speak(utt);
      onTurnChange?.(idx);
    },
    [transcript, speed, onTurnChange]
  );

  const toggle = () => {
    if (playing) {
      window.speechSynthesis?.cancel();
      setPlaying(false);
    } else {
      setPlaying(true);
      speak(turnIdx);
    }
  };

  // Update rate on the fly
  useEffect(() => {
    if (uttRef.current) uttRef.current.rate = speed;
  }, [speed]);

  // Cleanup on unmount
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const pct = transcript.length > 0 ? (turnIdx / transcript.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* TTS notice */}
      <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-primary)] px-3 py-1.5 rounded-lg border border-[var(--border-primary)]">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
        No recording available — playing via text-to-speech
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 w-full rounded-full bg-[var(--bg-primary)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Turn counter */}
      <div className="flex justify-between text-[10px] font-mono text-[var(--text-secondary)]">
        <span>Turn {Math.min(turnIdx + 1, transcript.length)} of {transcript.length}</span>
        <span>{playing ? "Speaking…" : "Paused"}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { window.speechSynthesis?.cancel(); const prev = Math.max(0, turnIdx - 1); setTurnIdx(prev); if (playing) speak(prev); }}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={toggle}
            className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-black hover:opacity-90 transition-opacity"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={() => { window.speechSynthesis?.cancel(); const next = Math.min(transcript.length - 1, turnIdx + 1); setTurnIdx(next); if (playing) speak(next); }}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => setSpeedIdx((i) => (i + 1) % SPEEDS.length)}
          className="text-[10px] font-mono font-bold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors w-8 text-center"
        >
          {speed}x
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
export default function AudioPlayer({ recordingUrl, transcript = [], onTurnChange }: AudioPlayerProps) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          Audio Playback
        </span>
        {recordingUrl && (
          <a
            href={recordingUrl}
            download
            className="ml-auto text-[10px] font-mono text-[var(--accent)] hover:underline"
          >
            Download
          </a>
        )}
      </div>

      {recordingUrl ? (
        <FilePlayer url={recordingUrl} transcript={transcript} onTurnChange={onTurnChange} />
      ) : transcript.length > 0 ? (
        <TtsPlayer transcript={transcript} onTurnChange={onTurnChange} />
      ) : (
        <p className="text-[var(--text-secondary)] text-xs font-mono text-center py-4">
          No audio or transcript available for this session.
        </p>
      )}
    </div>
  );
}
