import { useId, useState } from 'react';
import type { WorkItem } from '../types/work';
import { buildCsv, buildXlsxBlob, downloadBlob, exportFilename, filterItemsByDateRange } from '../lib/export';

interface Props {
  items: WorkItem[];
  defaultDate: string;
  onClose: () => void;
}

type ExportFormat = 'csv' | 'xlsx';

export default function ExportModal({ items, defaultDate, onClose }: Props) {
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [generated, setGenerated] = useState(false);
  const startId = useId();
  const endId = useId();

  const rangeValid = startDate <= endDate;
  const matches = rangeValid ? filterItemsByDateRange(items, startDate, endDate) : [];

  const handleGenerate = () => {
    if (!rangeValid || matches.length === 0) {
      setGenerated(true);
      return;
    }
    const now = new Date();
    if (format === 'csv') {
      const csv = buildCsv(matches, now);
      downloadBlob(exportFilename(startDate, endDate, 'csv'), new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    } else {
      downloadBlob(exportFilename(startDate, endDate, 'xlsx'), buildXlsxBlob(matches, now));
    }
    setGenerated(true);
  };

  return (
    <div className="overlay overlay-center" role="dialog" aria-modal="true" aria-labelledby="export-title">
      <div className="modal" style={{ width: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 id="export-title" style={{ fontSize: 18 }}>
            Export Work Tracking
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close">
            Close
          </button>
        </div>

        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18 }}>
          <div>
            <label className="field-label" htmlFor={startId}>
              Start date
            </label>
            <input
              id={startId}
              type="date"
              className="input"
              value={startDate}
              max={endDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setGenerated(false);
              }}
            />
          </div>
          <div>
            <label className="field-label" htmlFor={endId}>
              End date
            </label>
            <input
              id={endId}
              type="date"
              className="input"
              value={endDate}
              min={startDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setGenerated(false);
              }}
            />
          </div>
        </div>

        <div className="field-label" style={{ marginTop: 18 }} id="export-format-label">
          Format
        </div>
        <div role="radiogroup" aria-labelledby="export-format-label" style={{ display: 'flex', gap: 8 }}>
          <FormatOption label="CSV" active={format === 'csv'} onSelect={() => setFormat('csv')} />
          <FormatOption label="Excel (.xlsx)" active={format === 'xlsx'} onSelect={() => setFormat('xlsx')} />
        </div>

        <div style={{ marginTop: 18, minHeight: 20 }}>
          {!rangeValid && (
            <div className="field-error" role="alert">
              Start date must be on or before the end date.
            </div>
          )}
          {rangeValid && generated && matches.length === 0 && (
            <div className="empty-state" style={{ padding: '18px 16px' }}>
              No work records found for this date range.
            </div>
          )}
          {rangeValid && matches.length > 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
              {matches.length} work item{matches.length === 1 ? '' : 's'} in range.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleGenerate} className="btn btn-primary" disabled={!rangeValid}>
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}

function FormatOption({ label, active, onSelect }: { label: string; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className="btn btn-sm"
      style={{
        border: `1px solid ${active ? 'var(--brand)' : 'var(--border-strong)'}`,
        background: active ? 'var(--brand-bg)' : 'transparent',
        color: active ? 'var(--brand-strong)' : 'var(--text-muted)',
      }}
    >
      {label}
    </button>
  );
}
