import { useEffect, useState } from 'react';
import type { WorkItem, WorkSession } from '../types/work';
import { computeActiveMs, formatDuration, getPhase } from '../lib/timer';

interface Props {
  item: WorkItem;
  // The item's currently open (running/paused) session, if any.
  activeSession: WorkSession | undefined;
  // Sum of every OTHER (already-ended) session's active time for this item.
  priorActiveMs: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const PHASE_TEXT_COLOR: Record<string, string> = {
  not_started: 'var(--text-muted)',
  running: 'var(--status-running)',
  paused: 'var(--status-paused)',
};

export default function TimerCard({ item, activeSession, priorActiveMs, onStart, onPause, onResume, onStop }: Props) {
  const phase = activeSession ? getPhase(activeSession) : 'not_started';
  const hasHistory = priorActiveMs > 0;
  const [, forceTick] = useState(0);

  // Re-render every second while running so the displayed duration is live.
  // The authoritative value is still always derived from the interval list.
  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const currentSessionMs = activeSession ? computeActiveMs(activeSession, new Date()) : 0;
  const totalMs = priorActiveMs + currentSessionMs;

  return (
    <div className="panel" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            {item.workId}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 3 }}>{item.taskTitle}</div>
        </div>
        <PhaseBadge phase={phase} />
      </div>

      <div
        className="mono"
        role="timer"
        aria-label={`Total active time: ${formatDuration(totalMs)}, ${phase.replace('_', ' ')}`}
        style={{
          fontSize: 42,
          fontWeight: 600,
          margin: '20px 0 4px',
          color: PHASE_TEXT_COLOR[phase],
          letterSpacing: '0.01em',
        }}
      >
        {formatDuration(totalMs)}
      </div>
      {hasHistory && (
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 16 }}>
          Previous: <span className="mono">{formatDuration(priorActiveMs)}</span> · Current session:{' '}
          <span className="mono">{formatDuration(currentSessionMs)}</span>
        </div>
      )}
      {!hasHistory && <div style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', gap: 8 }}>
        {phase === 'not_started' && (
          <button onClick={onStart} className="btn btn-primary">
            {hasHistory ? 'Continue' : 'Start'}
          </button>
        )}
        {phase === 'running' && (
          <>
            <button onClick={onPause} className="btn btn-secondary">
              Pause
            </button>
            <button onClick={onStop} className="btn btn-danger">
              Stop
            </button>
          </>
        )}
        {phase === 'paused' && (
          <>
            <button onClick={onResume} className="btn btn-primary">
              Resume
            </button>
            <button onClick={onStop} className="btn btn-danger">
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  const badgeClass = phase === 'running' ? 'badge-running' : phase === 'paused' ? 'badge-paused' : 'badge-neutral';
  const label = phase === 'running' ? 'Running' : phase === 'paused' ? 'Paused' : 'Not running';
  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" aria-hidden />
      {label}
    </span>
  );
}
