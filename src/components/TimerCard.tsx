import { useEffect, useState } from 'react';
import type { WorkItem } from '../types/work';
import { computeSessionActiveMs, computeWorkItemActiveMs, formatDuration, getActiveSession, getSessionPhase } from '../lib/timer';

interface Props {
  item: WorkItem;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export default function TimerCard({ item, onPause, onResume, onStop }: Props) {
  const session = getActiveSession(item);
  const [, tick] = useState(0);
  const phase = session ? getSessionPhase(session) : 'stopped';

  useEffect(() => {
    if (phase !== 'running') return;
    const id = window.setInterval(() => tick((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  if (!session) return null;

  const sessionMs = computeSessionActiveMs(session, new Date());
  const totalMs = computeWorkItemActiveMs(item, new Date());

  return (
    <article className={`timer-card timer-card-${phase}`}>
      <div className="timer-card-header">
        <div>
          <div className="timer-kicker mono">{item.workId} · Session {item.sessions.length} of {item.sessions.length}</div>
          <h2>{item.taskTitle}</h2>
          <p>{item.project}{item.environment ? ` · ${item.environment}` : ''}</p>
        </div>
        <span className={`badge ${phase === 'running' ? 'badge-running' : 'badge-paused'}`}>{phase === 'running' ? 'Running' : 'Paused'}</span>
      </div>
      <div className="timer-metrics">
        <TimerMetric label="Session time" value={formatDuration(sessionMs)} live />
        <TimerMetric label="Work Item total" value={formatDuration(totalMs)} />
      </div>
      <div className="timer-actions">
        {phase === 'running' ? <button onClick={onPause} className="btn btn-secondary">Pause</button> : <button onClick={onResume} className="btn btn-primary">Resume</button>}
        <button onClick={onStop} className="btn btn-danger">Stop Session</button>
      </div>
    </article>
  );
}

function TimerMetric({ label, value, live = false }: { label: string; value: string; live?: boolean }) {
  return <div className="timer-metric"><span>{label}</span><strong className="mono" role={live ? 'timer' : undefined} aria-label={`${label}: ${value}`}>{value}</strong></div>;
}
