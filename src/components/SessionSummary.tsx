import { useRef, useState } from 'react';
import type { WorkItem, WorkStatus } from '../types/work';
import { WORK_STATUSES } from '../types/work';
import { computeSessionActiveMs, computeWorkItemActiveMs, formatDuration } from '../lib/timer';
import { useModalAccessibility } from './useModalAccessibility';

export default function SessionSummary({ item, onSave }: { item: WorkItem; onSave: (updates: { status: WorkStatus; outcome?: string; notes?: string }) => void }) {
  const [status, setStatus] = useState<WorkStatus>(item.status);
  const [outcome, setOutcome] = useState(item.outcome ?? '');
  const [notes, setNotes] = useState(item.notes ?? '');
  const saveRef = useRef<HTMLButtonElement>(null);
  // A session summary is intentionally confirmed with Save; Escape keeps it open.
  const dialogRef = useModalAccessibility(() => undefined, saveRef);
  const session = item.sessions[item.sessions.length - 1];

  return (
    <div className="overlay overlay-center">
      <div
          ref={dialogRef}
          className="modal modal-summary"
          role="dialog"
          aria-modal="true"
          aria-label="Session recorded"
          tabIndex={-1}
        >
        <div className="summary-mark" aria-hidden>✓</div>
        <p className="eyebrow">Session recorded</p>
        <div className="mono summary-work-id">{item.workId}</div>
        <h2 id="session-summary-title">{item.taskTitle}</h2>
        <p className="summary-copy">This session is complete. The Work Item remains available to continue unless you mark it Completed.</p>
        <div className="summary-metrics">
          <SummaryStat label="This session" value={formatDuration(computeSessionActiveMs(session, new Date()))} />
          <SummaryStat label="Work Item total" value={formatDuration(computeWorkItemActiveMs(item, new Date()))} />
        </div>
        <label className="field-label" htmlFor="summary-status">Work Item status</label>
        <select id="summary-status" className="select" value={status} onChange={(event) => setStatus(event.target.value as WorkStatus)}>
          {WORK_STATUSES.map((value) => <option key={value}>{value}</option>)}
        </select>
        <label className="field-label" htmlFor="summary-outcome">Outcome <span className="field-hint">optional</span></label>
        <textarea id="summary-outcome" className="textarea" value={outcome} onChange={(event) => setOutcome(event.target.value)} />
        <label className="field-label" htmlFor="summary-notes">Notes <span className="field-hint">optional</span></label>
        <textarea id="summary-notes" className="textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <div className="modal-footer">
          <button ref={saveRef} onClick={() => onSave({ status, outcome: outcome.trim() || undefined, notes: notes.trim() || undefined })} className="btn btn-primary">Save &amp; Close</button>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong className="mono">{value}</strong></div>;
}
