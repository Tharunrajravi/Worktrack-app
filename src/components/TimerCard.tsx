import { useEffect, useState } from 'react';
import type { WorkItem } from '../types/work';
import { computeActiveMs, formatDuration, getPhase } from '../lib/timer';

interface Props {
  item: WorkItem;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const PHASE_TEXT_COLOR: Record<string, string> = {
  not_started: 'var(--text-muted)',
  running: 'var(--status-running)',
  paused: 'var(--status-paused)',
  stopped: 'var(--text-muted)',
};

const PHASE_LABEL: Record<string, string> = {
  not_started: 'Not started',
  running: 'Running',
  paused: 'Paused',
  stopped: 'Stopped',
};

export default function TimerCard({ item, onStart, onPause, onResume, onStop }: Props) {
  const phase = getPhase(item.timer);
  const [, forceTick] = useState(0);

  // Re-render every second while running so the displayed duration is live.
  // The authoritative value is still always derived from the interval list.
  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const activeMs = computeActiveMs(item.timer, new Date());

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
        aria-label={`Active time spent: ${formatDuration(activeMs)}, ${PHASE_LABEL[phase].toLowerCase()}`}
        style={{
          fontSize: 42,
          fontWeight: 600,
          margin: '20px 0',
          color: PHASE_TEXT_COLOR[phase],
          letterSpacing: '0.01em',
        }}
      >
        {formatDuration(activeMs)}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {phase === 'not_started' && (
          <button onClick={onStart} className="btn btn-primary">
            Start
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
        {phase === 'stopped' && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Session complete</span>}
      </div>
    </div>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  const badgeClass =
    phase === 'running' ? 'badge-running' : phase === 'paused' ? 'badge-paused' : 'badge-neutral';
  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" aria-hidden />
      {PHASE_LABEL[phase]}
    </span>
  );
}
