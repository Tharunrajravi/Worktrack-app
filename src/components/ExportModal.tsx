import { useId, useState } from 'react';
import { apiExportWorkItems } from '../lib/api';

interface Props {
  defaultDate: string;
  onClose: () => void;
}

type ExportFormat = 'csv' | 'xlsx';

export default function ExportModal({ defaultDate, onClose }: Props) {
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const startId = useId();
  const endId = useId();

  const rangeValid = startDate <= endDate;

  const handleGenerate = async () => {
    if (!rangeValid || loading) return;

    setLoading(true);
    setGenerated(false);
    setError(null);
    setRowCount(null);

    try {
      // The Lambda currently generates CSV, uploads it to S3 and returns a
      // short-lived presigned URL. Keep the existing Excel option visible for
      // compatibility, but route both options through the cloud export API
      // until the backend adds XLSX generation.
      if (format === 'xlsx') {
        setError('Excel export is not available from the current cloud export service. Please choose CSV.');
        return;
      }

      const result = await apiExportWorkItems(startDate, endDate);
      setRowCount(result.rowCount);
      setGenerated(true);

      // The URL is the S3 presigned URL returned by Lambda. Navigating to it
      // lets the browser perform the actual download without exposing AWS
      // credentials in the frontend.
      window.location.assign(result.downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The report could not be generated.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay overlay-center" role="dialog" aria-modal="true" aria-labelledby="export-title">
      <div className="modal" style={{ width: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 id="export-title" style={{ fontSize: 18 }}>Export Work Tracking</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close">Close</button>
        </div>

        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18 }}>
          <div>
            <label className="field-label" htmlFor={startId}>Start date</label>
            <input id={startId} type="date" className="input" value={startDate} max={endDate} onChange={(e) => { setStartDate(e.target.value); setGenerated(false); setError(null); }} />
          </div>
          <div>
            <label className="field-label" htmlFor={endId}>End date</label>
            <input id={endId} type="date" className="input" value={endDate} min={startDate} onChange={(e) => { setEndDate(e.target.value); setGenerated(false); setError(null); }} />
          </div>
        </div>

        <div className="field-label" style={{ marginTop: 18 }} id="export-format-label">Format</div>
        <div role="radiogroup" aria-labelledby="export-format-label" style={{ display: 'flex', gap: 8 }}>
          <FormatOption label="CSV" active={format === 'csv'} onSelect={() => { setFormat('csv'); setError(null); }} />
          <FormatOption label="Excel (.xlsx)" active={format === 'xlsx'} onSelect={() => { setFormat('xlsx'); setError(null); }} />
        </div>

        <div style={{ marginTop: 18, minHeight: 20 }}>
          {!rangeValid && <div className="field-error" role="alert">Start date must be on or before the end date.</div>}
          {error && <div className="field-error" role="alert">{error}</div>}
          {rangeValid && generated && rowCount !== null && (
            <div style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
              {rowCount} work item{rowCount === 1 ? '' : 's'} exported to S3. Your download should begin automatically.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={handleGenerate} className="btn btn-primary" disabled={!rangeValid || loading}>
            {loading ? 'Generating…' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormatOption({ label, active, onSelect }: { label: string; active: boolean; onSelect: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={active} onClick={onSelect} className="btn btn-sm" style={{ border: `1px solid ${active ? 'var(--brand)' : 'var(--border-strong)'}`, background: active ? 'var(--brand-bg)' : 'transparent', color: active ? 'var(--brand-strong)' : 'var(--text-muted)' }}>
      {label}
    </button>
  );
}
