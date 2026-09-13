import { useEffect, useState, type ReactNode } from 'react';
import { listWorkItems } from '../lib/storage';
import { computeActiveMs, formatDuration, getPhase } from '../lib/timer';
import type { WorkItem, WorkStatus } from '../types/work';

export default function WorkTrackPage() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listWorkItems().then((all) => {
      setItems(all);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>Work Track</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 22 }}>
        What actually happened — planned intent vs. active time spent, across every work item.
      </p>

      {items.length === 0 ? (
        <div className="empty-state">No work records found yet.</div>
      ) : (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <Th>Work ID</Th>
                <Th>Date</Th>
                <Th>Task</Th>
                <Th>Project</Th>
                <Th>Status</Th>
                <Th>Priority</Th>
                <Th align="right">Active Time</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <Td mono>{item.workId}</Td>
                  <Td>{item.date}</Td>
                  <Td>{item.taskTitle}</Td>
                  <Td>{item.project}</Td>
                  <Td>
                    <StatusBadge status={item.status} />
                  </Td>
                  <Td>{item.priority}</Td>
                  <Td mono align="right">
                    {getPhase(item.timer) === 'not_started' ? '—' : formatDuration(computeActiveMs(item.timer, new Date()))}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: WorkStatus }) {
  const badgeClass = status === 'Blocked' ? 'badge-blocked' : status === 'In Progress' ? 'badge-running' : 'badge-neutral';
  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" aria-hidden />
      {status}
    </span>
  );
}

function Th({ children, align }: { children: ReactNode; align?: 'right' }) {
  return <th style={{ textAlign: align ?? 'left' }}>{children}</th>;
}

function Td({ children, mono, align }: { children: ReactNode; mono?: boolean; align?: 'right' }) {
  return (
    <td className={mono ? 'mono' : undefined} style={{ textAlign: align ?? 'left' }}>
      {children}
    </td>
  );
}
