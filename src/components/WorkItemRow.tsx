import type { WorkItem } from '../types/work';
import { computeWorkItemActiveMs, formatDuration, getActiveSession, isResumable } from '../lib/timer';

interface Props {
  item: WorkItem;
  onContinue?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function WorkItemRow({ item, onContinue, disabled = false, compact = false }: Props) {
  const active = getActiveSession(item);
  const resumable = isResumable(item);
  const badgeClass = active ? (active.endedAt ? 'badge-neutral' : 'badge-running') : item.status === 'Blocked' ? 'badge-blocked' : 'badge-neutral';

  return (
    <article className={`work-item-row ${active ? 'work-item-row-active' : ''} ${compact ? 'work-item-row-compact' : ''}`}>
      <div className="work-item-main">
        <div className="work-item-kicker">
          <span className="mono">{item.workId}</span>
          <span className={`badge ${badgeClass}`}>{active ? 'Active session' : item.status}</span>
        </div>
        <h3>{item.taskTitle}</h3>
        <p>{item.project}{item.environment ? ` · ${item.environment}` : ''}{item.category ? ` · ${item.category}` : ''}</p>
      </div>
      <div className="work-item-metrics">
        <span><strong>{item.sessions.length}</strong> {item.sessions.length === 1 ? 'session' : 'sessions'}</span>
        <span className="mono">{formatDuration(computeWorkItemActiveMs(item, new Date()))} total</span>
      </div>
      {resumable && onContinue && (
        <button type="button" onClick={onContinue} disabled={disabled} className="btn btn-primary work-item-continue" aria-label={`Continue ${item.taskTitle} under Work ID ${item.workId}`}>
          {item.sessions.length ? 'Continue' : 'Start'} <span aria-hidden>→</span>
        </button>
      )}
    </article>
  );
}
