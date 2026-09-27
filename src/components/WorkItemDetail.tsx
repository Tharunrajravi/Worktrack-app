import type { WorkItem, WorkSession } from '../types/work';
import { isResumableStatus } from '../types/work';
import { computeActiveMs, formatDuration, getPhase } from '../lib/timer';
import { computeItemActiveMs, sessionsForItem } from '../lib/sessions';

interface Props {
  item: WorkItem;
  sessions: WorkSession[];
  onClose: () => void;
  onContinue: (item: WorkItem) => void;
}

export default function WorkItemDetail({ item, sessions, onClose, onContinue }: Props) {
  const itemSessions = sessionsForItem(sessions, item.id);
  const totalMs = computeItemActiveMs(itemSessions, new Date());
  const resumable = isResumableStatus(item.status);
  const hasOpenSession = itemSessions.some((s) => {
    const phase = getPhase(s);
    return phase === 'running' || phase === 'paused';
  });

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="work-item-detail-title">
      <div className="modal" style={{ width: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              {item.workId}
            </div>
            <h2 id="work-item-detail-title" style={{ fontSize: 18, margin: '4px 0 0' }}>
              {item.taskTitle}
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close">
            Close
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, margin: '20px 0' }}>
          <Stat label="Project" value={item.project} />
          <Stat label="Priority" value={item.priority} />
          <Stat
            label="Status"
            value={
              <span className={`badge ${item.status === 'Blocked' ? 'badge-blocked' : item.status === 'In Progress' ? 'badge-running' : 'badge-neutral'}`}>
                <span className="badge-dot" aria-hidden />
                {item.status}
              </span>
            }
          />
        </div>
        <Stat label="Total Active Time" value={<span className="mono" style={{ fontSize: 20 }}>{formatDuration(totalMs)}</span>} />

        <div className="section-heading" style={{ marginTop: 22 }}>
          Work sessions
        </div>
        {itemSessions.length === 0 ? (
          <div className="empty-state" style={{ padding: '18px 16px' }}>
            No sessions recorded yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '30vh', overflowY: 'auto' }}>
            {itemSessions.map((session, i) => (
              <SessionRow key={session.id} index={i + 1} session={session} />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          {!resumable && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Completed — read-only history.</span>}
          {resumable && (
            <button onClick={() => onContinue(item)} disabled={hasOpenSession} className="btn btn-primary">
              {hasOpenSession ? 'Session already running' : 'Continue Work'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionRow({ index, session }: { index: number; session: WorkSession }) {
  const start = session.firstStartedAt ? new Date(session.firstStartedAt) : null;
  const end = session.stoppedAt ? new Date(session.stoppedAt) : null;
  const activeMs = computeActiveMs(session, new Date());
  const phase = getPhase(session);
  return (
    <div
      className="panel"
      style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-raised)' }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Session {index}</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {start ? start.toLocaleTimeString() : '—'} → {end ? end.toLocaleTimeString() : phase === 'running' ? 'now' : '—'}
        </div>
      </div>
      <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
        {formatDuration(activeMs)}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{value}</div>
    </div>
  );
}
