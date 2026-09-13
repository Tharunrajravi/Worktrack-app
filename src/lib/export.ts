// Export Work Tracking — Part 10 of the UI refinement spec.
// CSV generation is fully real (plain string building, no dependency).
// XLSX generation uses the `xlsx` package, entirely client-side — no AWS
// involved yet, per the "don't introduce AWS just to solve a UI problem"
// architecture rule. S3 + presigned URLs remain the Phase 4 plan for when
// this needs to run server-side against a much larger history.

import * as XLSX from 'xlsx';
import type { WorkItem } from '../types/work';
import { computeWorkItemActiveMs, formatDuration } from './timer';

const EXPORT_COLUMNS = [
  'Work ID',
  'Date',
  'Project',
  'Client',
  'Environment',
  'Category',
  'Task Title',
  'Description',
  'Status',
  'Priority',
  'Technologies',
  'Ticket / Incident ID',
  'Time Spent',
  'Outcome',
  'Notes',
  'Links',
] as const;

export function filterItemsByDateRange(items: WorkItem[], startDate: string, endDate: string): WorkItem[] {
  return items
    .filter((item) => item.date >= startDate && item.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

export function itemToRow(item: WorkItem, now: Date): string[] {
  const activeMs = computeWorkItemActiveMs(item, now);
  return [
    item.workId,
    item.date,
    item.project,
    item.client ?? '',
    item.environment ?? '',
    item.category ?? '',
    item.taskTitle,
    item.description,
    item.status,
    item.priority,
    item.technologies.join('; '),
    item.ticketId ?? '',
    formatDuration(activeMs),
    item.outcome ?? '',
    item.notes ?? '',
    item.links.map((l) => `${l.type}: ${l.url}`).join('; '),
  ];
}

export function buildCsv(items: WorkItem[], now: Date): string {
  const rows = [EXPORT_COLUMNS as unknown as string[], ...items.map((item) => itemToRow(item, now))];
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
}

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildXlsxBlob(items: WorkItem[], now: Date): Blob {
  const rows = [EXPORT_COLUMNS as unknown as string[], ...items.map((item) => itemToRow(item, now))];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = EXPORT_COLUMNS.map((col) => ({ wch: Math.max(12, col.length + 2) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Work Track');
  const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function exportFilename(startDate: string, endDate: string, ext: 'csv' | 'xlsx'): string {
  return `WorkTrack_Report_${startDate}_to_${endDate}.${ext}`;
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
