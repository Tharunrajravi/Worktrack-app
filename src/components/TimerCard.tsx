import { useEffect, useState } from 'react';
import type { WorkItem } from '../types/work';
import { computeSessionActiveMs, formatDuration, getActiveSession, getSessionPhase } from '../lib/timer';

interface Props { item: WorkItem; onPause: () => void; onResume: () => void; onStop: () => void; }

export default function TimerCard({ item, onPause, onResume, onStop }: Props) {
  const session = getActiveSession(item);
  const [, tick] = useState(0);
  const phase = session ? getSessionPhase(session) : 'stopped';
  useEffect(() => { if (phase !== 'running') return; const id = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(id); }, [phase]);
  if (!session) return null;
  const activeMs = computeSessionActiveMs(session, new Date());
  return <div className="panel" style={{ padding: '20px 22px' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div><div className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>{item.workId} · Session {item.sessions.length}</div><div style={{ fontSize: 16, fontWeight: 600, marginTop: 3 }}>{item.taskTitle}</div></div><span className={`badge ${phase === 'running' ? 'badge-running' : 'badge-paused'}`}>{phase === 'running' ? 'Running' : 'Paused'}</span></div><div className="mono" role="timer" style={{ fontSize: 42, fontWeight: 600, margin: '20px 0', color: phase === 'running' ? 'var(--status-running)' : 'var(--status-paused)' }}>{formatDuration(activeMs)}</div><div style={{ display: 'flex', gap: 8 }}>{phase === 'running' ? <button onClick={onPause} className="btn btn-secondary">Pause</button> : <button onClick={onResume} className="btn btn-primary">Resume</button>}<button onClick={onStop} className="btn btn-danger">Stop Session</button></div></div>;
}
