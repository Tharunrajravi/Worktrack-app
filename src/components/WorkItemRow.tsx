import type { WorkItem } from '../types/work';
import {
  computeWorkItemActiveMs,
  formatDuration,
  getActiveSession,
  isResumable,
} from '../lib/timer';

interface Props {
  item: WorkItem;
  onContinue?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function WorkItemRow({
  item,
  onContinue,
  disabled = false,
  compact = false,
}: Props) {
  const active = getActiveSession(item);
  const resumable = isResumable(item);

  const totalTime = computeWorkItemActiveMs(
    item,
    new Date(),
  );

  const statusLabel = active
    ? 'Active session'
    : item.status;

  const statusClass = active
    ? 'work-row-status-active'
    : item.status === 'Completed'
      ? 'work-row-status-completed'
      : item.status === 'Blocked'
        ? 'work-row-status-blocked'
        : item.status === 'In Progress'
          ? 'work-row-status-progress'
          : 'work-row-status-planned';

  return (
    <article
      className={[
        'work-row',
        active ? 'work-row-active' : '',
        compact ? 'work-row-compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Main work identity */}
      <div className="work-row-main">
        <div className="work-row-topline">
          <span className="work-row-id mono">
            {item.workId}
          </span>

          <span
            className={`work-row-status ${statusClass}`}
          >
            <span
              className="work-row-status-dot"
              aria-hidden="true"
            />

            {statusLabel}
          </span>
        </div>

        <h3 className="work-row-title">
          {item.taskTitle}
        </h3>

        <div className="work-row-context">
          <span className="work-row-project">
            {item.project}
          </span>

          {item.environment && (
            <>
              <span
                className="work-row-separator"
                aria-hidden="true"
              >
                /
              </span>

              <span>{item.environment}</span>
            </>
          )}

          {item.category && (
            <>
              <span
                className="work-row-separator"
                aria-hidden="true"
              >
                /
              </span>

              <span>{item.category}</span>
            </>
          )}
        </div>
      </div>

      {/* Work metadata */}
      <div className="work-row-meta">
        <div className="work-row-meta-item">
          <span className="work-row-meta-label">
            Sessions
          </span>

          <span className="work-row-meta-value mono">
            {String(item.sessions.length).padStart(
              2,
              '0',
            )}
          </span>
        </div>

        <div className="work-row-meta-item">
          <span className="work-row-meta-label">
            Time tracked
          </span>

          <span className="work-row-meta-value mono">
            {formatDuration(totalTime)}
          </span>
        </div>

        <div className="work-row-meta-item">
          <span className="work-row-meta-label">
            Priority
          </span>

          <span
            className={`work-row-priority work-row-priority-${item.priority.toLowerCase()}`}
          >
            {item.priority}
          </span>
        </div>
      </div>

      {/* Action */}
      {resumable && onContinue ? (
        <div className="work-row-action">
          <button
            type="button"
            onClick={onContinue}
            disabled={disabled}
            className="work-row-continue"
            aria-label={`${
              item.sessions.length
                ? 'Continue'
                : 'Start'
            } ${item.taskTitle} under Work ID ${
              item.workId
            }`}
          >
            <span>
              {item.sessions.length
                ? 'Continue'
                : 'Start'}
            </span>

            <span
              className="work-row-continue-arrow"
              aria-hidden="true"
            >
              →
            </span>
          </button>
        </div>
      ) : (
        <div
          className="work-row-state"
          aria-hidden="true"
        >
          <span className="work-row-state-line" />
        </div>
      )}
    </article>
  );
}
