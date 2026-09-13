// Human-readable Work ID generation: WT-YYYYMMDD-NNN
// This is separate from the internal uuid (WorkItem.id) — the uuid is the
// real DB key so this format can change later without breaking references.

export function formatDateForWorkId(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}${m}${d}`;
}

// `existingIdsForDate` — the workIds already used for that date — determines
// the running sequence number. Passed in rather than read from storage
// directly, so this stays a pure, testable function.
export function generateWorkId(date: Date, existingIdsForDate: string[]): string {
  const datePart = formatDateForWorkId(date);
  const prefix = `WT-${datePart}-`;
  const usedNumbers = existingIdsForDate
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;
  return `${prefix}${next.toString().padStart(3, '0')}`;
}
