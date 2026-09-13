import { v4 as uuid } from 'uuid';
import { computeSessionActiveMs } from './timer';
import type { TimerState, WorkItem, WorkSession } from '../types/work';

const ITEMS_KEY = 'worktrack_items_v1';

function readAll(): WorkItem[] {
  const raw = localStorage.getItem(ITEMS_KEY);
  if (!raw) return [];
  try {
    const original = JSON.parse(raw) as Array<WorkItem & { timer?: TimerState }>;
    const migrated = original.map(migrateWorkItem);
    if (original.some((item) => !Array.isArray(item.sessions))) writeAll(migrated);
    return migrated;
  } catch {
    return [];
  }
}

// Preserves V1 timer history as one session; it never discards tracked time.
function migrateWorkItem(item: WorkItem & { timer?: TimerState }): WorkItem {
  if (Array.isArray(item.sessions)) return item;
  const { timer, ...withoutTimer } = item;
  if (!timer?.intervals?.length) return { ...withoutTimer, sessions: [] };
  const base: WorkSession = {
    sessionId: `legacy-${item.id}-${uuid()}`,
    workItemId: item.id,
    startedAt: timer.firstStartedAt ?? timer.intervals[0].start,
    endedAt: timer.stoppedAt,
    intervals: timer.intervals,
    activeDuration: 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
  return { ...withoutTimer, sessions: [{ ...base, activeDuration: computeSessionActiveMs(base, new Date()) }] };
}

function writeAll(items: WorkItem[]): void {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export async function listWorkItems(): Promise<WorkItem[]> {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getWorkItem(id: string): Promise<WorkItem | undefined> {
  return readAll().find((item) => item.id === id);
}

export async function getWorkIdsForDate(date: string): Promise<string[]> {
  return readAll().filter((item) => item.date === date).map((item) => item.workId);
}

export async function saveWorkItem(item: WorkItem): Promise<WorkItem> {
  const items = readAll();
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index >= 0) items[index] = item;
  else items.push(item);
  writeAll(items);
  return item;
}

export async function deleteWorkItem(id: string): Promise<void> {
  writeAll(readAll().filter((item) => item.id !== id));
}
