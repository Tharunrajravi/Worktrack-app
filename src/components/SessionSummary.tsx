import { useId, useState } from 'react';
import type { WorkItem, WorkStatus } from '../types/work';
import { WORK_STATUSES } from '../types/work';
import { computeActiveMs, formatDuration } from '../lib/timer';

interface Props {
  item: WorkItem;
  onSave: (updates: { status: WorkStatus; outcome?: string; notes?: string }) => void;
}

export default function SessionSummary({ item, onSave }: Props) {
  const [status, setStatus] = useState<WorkStatus>(item.status === 'Planned' ? 'Completed' : item.status);
  const [outcome, setOutcome] = useState(item.outcome ?? '');
  const [notes, setNotes] = useState(item.notes ?? '');
  const statusId = useId();
  const outcomeId = useId();
  const notesId = useId();

  const activeMs = computeActiveMs(item.timer, new Date());
  const start = item.timer.firstStartedAt ? new Date(item.timer.firstStartedAt) : null;
  const end = item.timer.stoppedAt ? new Date(item.timer.stoppedAt) : null;

  return (
    <div className="overlay overlay-center" role="dialog" aria-modal="true" aria-labelledby="session-summary-title">
      <div className="modal" style={{ width: 480 }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          {item.workId}
        </div>
        <h2 id="session-summary-title" style={{ fontSize: 18, margin: '4px 0 20px' }}>
          Work Session Summary
        </h2>

        <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.taskTitle}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '16px 0 20px' }}>
          <SummaryStat label="Start Time" value={start ? start.toLocaleTimeString() : '—'} />
          <SummaryStat label="End Time" value={end ? end.toLocaleTimeString() : '—'} />
          <SummaryStat label="Active Time Spent" value={formatDuration(activeMs)} highlight />
          <SummaryStat label="Status" value={status} />
        </div>

        <label className="field-label" htmlFor={statusId}>
          Status
        </label>
        <select id={statusId} className="select" value={status} onChange={(e) => setStatus(e.target.value as WorkStatus)}>
          {WORK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label className="field-label" htmlFor={outcomeId} style={{ marginTop: 14 }}>
          Outcome <span className="field-hint">optional</span>
        </label>
        <textarea
          id={outcomeId}
          className="textarea"
          style={{ minHeight: 60 }}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="What was the result?"
        />

        <label className="field-label" htmlFor={notesId} style={{ marginTop: 14 }}>
          Notes <span className="field-hint">optional</span>
        </label>
        <textarea id={notesId} className="textarea" style={{ minHeight: 60 }} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
          <button
            onClick={() => onSave({ status, outcome: outcome.trim() || undefined, notes: notes.trim() || undefined })}
            className="btn btn-primary"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{label}</div>
      <div
        className="mono"
        style={{ fontSize: highlight ? 20 : 14, fontWeight: 600, color: highlight ? 'var(--status-running)' : 'var(--text)' }}
      >
        {value}
      </div>
    </div>
  );
}
