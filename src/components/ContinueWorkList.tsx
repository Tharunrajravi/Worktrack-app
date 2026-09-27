import { useMemo, useState } from 'react';
import type { WorkItem, WorkSession, WorkStatus } from '../types/work';
import { isResumableStatus } from '../types/work';
import { computeItemActiveMs, lastWorkedAt, sessionsForItem } from '../lib/sessions';
import { formatDuration } from '../lib/timer';

interface Props {
  items: WorkItem[];
  sessions: WorkSession[];
  onSelect: (item: WorkItem) => void;
  onClose: () => void;
}

const STATUS_PRIORITY: Record<WorkStatus, number> = { 'In Progress': 0, Blocked: 1, Planned: 2, Completed: 3 };

export default function ContinueWorkList({ items, sessions, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkStatus | 'All'>('All');

  const resumable = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => isResumableStatus(item.status))
      .filter((item) => statusFilter === 'All' || item.status === statusFilter)
      .filter(
        (item) =>
          !q || item.workId.toLowerCase().includes(q) || item.taskTitle.toLowerCase().includes(q) || item.project.toLowerCase().includes(q),
      )
      .sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status] || b.updatedAt.localeCompare(a.updatedAt));
  }, [items, query, statusFilter]);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="continue-work-title">
      <div className="modal" style={{ width: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 id="continue-work-title" style={{ fontSize: 18 }}>
            Continue Previous Work
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close">
            Close
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="Search Work ID, task, or project"
            aria-label="Search resumable work"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="select"
            style={{ width: 150 }}
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as WorkStatus | 'All')}
          >
            <option value="All">All statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Planned">Planned</option>
          </select>
        </div>

        {resumable.length === 0 ? (
          <div className="empty-state">No resumable work items match this search.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '50vh', overflowY: 'auto' }}>
            {resumable.map((item) => {
              const itemSessions = sessionsForItem(sessions, item.id);
              const totalMs = computeItemActiveMs(itemSessions, new Date());
              const worked = lastWorkedAt(itemSessions);
              return (
                <div key={item.id} className="work-row">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                        {item.workId}
                      </span>
                      <span className={`badge ${item.status === 'Blocked' ? 'badge-blocked' : 'badge-running'}`}>
                        <span className="badge-dot" aria-hidden />
                        {item.status}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, marginTop: 3 }}>{item.taskTitle}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      {item.project} · Total active time <span className="mono">{formatDuration(totalMs)}</span> · Last worked{' '}
                      {formatLastWorked(worked)}
                    </div>
                  </div>
                  <button onClick={() => onSelect(item)} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                    Continue Work
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatLastWorked(date: Date | null): string {
  if (!date) return 'never';
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `today, ${time}`;
  if (isYesterday) return `yesterday, ${time}`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
