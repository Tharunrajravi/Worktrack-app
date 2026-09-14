import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '../components/LoadingSkeleton';
import WorkItemRow from '../components/WorkItemRow';
import { apiListWorkItems } from '../lib/api';
import {
  computeWorkItemActiveMs,
  formatDuration,
  isResumable,
} from '../lib/timer';
import type { WorkItem } from '../types/work';

export default function WorkTrackPage() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const workItems = await apiListWorkItems();

      setItems(workItems);
    } catch (err) {
      console.error('Failed to load Work Track:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Work history could not be loaded. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const continueItem = (item: WorkItem) => {
    navigate('/', {
      state: {
        continueItemId: item.id,
      },
    });
  };

  if (loading) {
    return <LoadingSkeleton label="Loading Work Track" />;
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Operational ledger</p>

          <h1>Work Track</h1>

          <p>
            Work Items, their recorded sessions, and accumulated active time.
          </p>
        </div>
      </header>

      {error && (
        <div className="error-notice" role="alert">
          <span>{error}</span>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => void load()}
          >
            Retry
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          No work records found yet.
        </div>
      ) : (
        <>
          <div className="panel work-track-ledger">
            <table className="table">
              <thead>
                <tr>
                  <th>Work Item</th>
                  <th>Status</th>
                  <th>Sessions</th>
                  <th className="table-number">
                    Total Active Time
                  </th>
                  <th aria-label="Actions" />
                </tr>
              </thead>

              <tbody>
                {items.map((item) => {
                  const resumable = isResumable(item);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="ledger-task">
                          {item.taskTitle}
                        </div>

                        <div className="ledger-meta">
                          <span className="mono">
                            {item.workId}
                          </span>

                          <span>
                            {item.project}
                            {item.environment
                              ? ` · ${item.environment}`
                              : ''}
                          </span>
                        </div>
                      </td>

                      <td>
                        <StatusBadge status={item.status} />
                      </td>

                      <td>
                        {item.sessions.length}{' '}
                        {item.sessions.length === 1
                          ? 'session'
                          : 'sessions'}
                      </td>

                      <td className="mono table-number">
                        {formatDuration(
                          computeWorkItemActiveMs(
                            item,
                            new Date(),
                          ),
                        )}
                      </td>

                      <td className="table-action">
                        {resumable && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => continueItem(item)}
                            aria-label={`Continue ${item.taskTitle} under Work ID ${item.workId}`}
                          >
                            Continue{' '}
                            <span aria-hidden>→</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="work-track-cards">
            {items.map((item) => (
              <WorkItemRow
                key={item.id}
                item={item}
                onContinue={() => continueItem(item)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}


function StatusBadge({
  status,
}: {
  status: WorkItem['status'];
}) {
  const badgeClass =
    status === 'In Progress'
      ? 'badge-running'
      : status === 'Blocked'
        ? 'badge-blocked'
        : 'badge-neutral';

  return (
    <span className={`badge ${badgeClass}`}>
      {status}
    </span>
  );
}
