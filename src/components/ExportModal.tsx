import { useId, useRef, useState } from 'react';
import { useModalAccessibility } from './useModalAccessibility';
import { apiExportWorkItems } from '../lib/api';

interface Props {
  defaultDate: string;
  onClose: () => void;
}

type ExportFormat = 'csv' | 'xlsx';

export default function ExportModal({
  defaultDate,
  onClose,
}: Props) {
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [generated, setGenerated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const startId = useId();
  const endId = useId();

  const generateRef =
    useRef<HTMLButtonElement>(null);

  const dialogRef =
    useModalAccessibility(
      onClose,
      generateRef,
    );

  const rangeValid =
    startDate <= endDate;

  const handleGenerate = async () => {
    setExportError(null);
    setGenerated(false);
    setRowCount(null);

    if (!rangeValid) {
      return;
    }

    if (format === 'xlsx') {
      setExportError(
        'Excel export is not available yet. Please select CSV.',
      );
      return;
    }

    setExporting(true);

    try {
      const result =
        await apiExportWorkItems(
          startDate,
          endDate,
        );

      setRowCount(result.rowCount);

      const link =
        document.createElement('a');

      link.href =
        result.downloadUrl;

      link.download =
        result.fileName;

      link.target = '_blank';

      link.rel =
        'noopener noreferrer';

      document.body.appendChild(link);

      link.click();

      link.remove();

      setGenerated(true);
    } catch (error) {
      console.error(
        'Failed to export Work Tracking:',
        error,
      );

      setExportError(
        error instanceof Error
          ? error.message
          : 'The report could not be generated. Please try again.',
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="overlay overlay-center">
      <div
        ref={dialogRef}
        className="modal modal-export"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        tabIndex={-1}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            id="export-title"
            style={{ fontSize: 18 }}
          >
            Export Work Tracking
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            aria-label="Close"
            disabled={exporting}
          >
            Close
          </button>
        </div>

        <div
          className="form-grid-2"
          style={{
            display: 'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap: 14,
            marginTop: 18,
          }}
        >
          <div>
            <label
              className="field-label"
              htmlFor={startId}
            >
              Start date
            </label>

            <input
              id={startId}
              type="date"
              className="input"
              value={startDate}
              max={endDate}
              disabled={exporting}
              onChange={(event) => {
                setStartDate(
                  event.target.value,
                );
                setGenerated(false);
                setRowCount(null);
                setExportError(null);
              }}
            />
          </div>

          <div>
            <label
              className="field-label"
              htmlFor={endId}
            >
              End date
            </label>

            <input
              id={endId}
              type="date"
              className="input"
              value={endDate}
              min={startDate}
              disabled={exporting}
              onChange={(event) => {
                setEndDate(
                  event.target.value,
                );
                setGenerated(false);
                setRowCount(null);
                setExportError(null);
              }}
            />
          </div>
        </div>

        <div
          className="field-label"
          style={{ marginTop: 18 }}
          id="export-format-label"
        >
          Format
        </div>

        <div
          role="radiogroup"
          aria-labelledby="export-format-label"
          style={{
            display: 'flex',
            gap: 8,
          }}
        >
          <FormatOption
            label="CSV"
            active={format === 'csv'}
            onSelect={() =>
              setFormat('csv')
            }
            disabled={exporting}
          />

          <FormatOption
            label="Excel (.xlsx) — Coming Soon"
            active={false}
            onSelect={() => {}}
            disabled
          />
        </div>

        <div
          style={{
            marginTop: 18,
            minHeight: 20,
          }}
        >
          {exportError && (
            <div
              className="field-error"
              role="alert"
            >
              {exportError}
            </div>
          )}

          {!rangeValid && (
            <div
              className="field-error"
              role="alert"
            >
              Start date must be on or before
              the end date.
            </div>
          )}

          {exporting && (
            <div
              style={{
                color:
                  'var(--text-muted)',
                fontSize: 12.5,
              }}
              role="status"
              aria-live="polite"
            >
              Generating your report...
            </div>
          )}

          {rangeValid &&
            generated &&
            rowCount === 0 && (
              <div
                className="empty-state"
                style={{
                  padding:
                    '18px 16px',
                }}
              >
                No work records found
                for this date range.
              </div>
            )}

          {rangeValid &&
            generated &&
            rowCount !== null &&
            rowCount > 0 && (
              <div
                style={{
                  color:
                    'var(--text-muted)',
                  fontSize: 12.5,
                }}
                role="status"
                aria-live="polite"
              >
                ✓ Export ready ·{' '}
                {rowCount} work item
                {rowCount === 1
                  ? ''
                  : 's'} exported.
              </div>
            )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 8,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={exporting}
          >
            Cancel
          </button>

          <button
            ref={generateRef}
            type="button"
            onClick={() =>
              void handleGenerate()
            }
            className="btn btn-primary"
            disabled={
              !rangeValid ||
              exporting
            }
          >
            {exporting
              ? 'Generating...'
              : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormatOption({
  label,
  active,
  onSelect,
  disabled = false,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-disabled={disabled}
      onClick={onSelect}
      disabled={disabled}
      className="btn btn-sm"
      style={{
        border: `1px solid ${
          active
            ? 'var(--brand)'
            : 'var(--border-strong)'
        }`,
        background: active
          ? 'var(--brand-bg)'
          : 'transparent',
        color: active
          ? 'var(--brand-strong)'
          : 'var(--text-muted)',
        opacity: disabled
          ? 0.55
          : 1,
        cursor: disabled
          ? 'not-allowed'
          : 'pointer',
      }}
    >
      {label}
    </button>
  );
}
