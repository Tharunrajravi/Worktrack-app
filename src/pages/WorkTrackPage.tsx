import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkTrackData } from '../hooks/useWorkTrackData';
import { computeItemActiveMs } from '../lib/sessions';
import { formatDuration } from '../lib/timer';
import type { WorkItem, WorkStatus } from '../types/work';
import WorkItemDetail from '../components/WorkItemDetail';

export default function WorkTrackPage() {
  const { items, sessions, loading, getSessionsForItem, startSession } = useWorkTrackData();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const navigate = useNavigate();

  if (loading) return null;
  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null;

  const handleContinue = async (item: WorkItem) => {
    setSelectedItemId(null);
    await startSession(item);
    navigate('/');
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>Work Track</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 22 }}>
        What actually happened — planned intent vs. active time spent, across every work item. Click a row to see its sessions.
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
              {items.map((item) => {
                const totalMs = computeItemActiveMs(getSessionsForItem(item.id), new Date());
                return (
                  <tr key={item.id} onClick={() => setSelectedItemId(item.id)} style={{ cursor: 'pointer' }} tabIndex={0}>
                    <Td mono>{item.workId}</Td>
                    <Td>{item.date}</Td>
                    <Td>{item.taskTitle}</Td>
                    <Td>{item.project}</Td>
                    <Td>
                      <StatusBadge status={item.status} />
                    </Td>
                    <Td>{item.priority}</Td>
                    <Td mono align="right">
                      {totalMs === 0 ? '—' : formatDuration(totalMs)}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedItem && (
        <WorkItemDetail
          item={selectedItem}
          sessions={sessions}
          onClose={() => setSelectedItemId(null)}
          onContinue={handleContinue}
        />
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
