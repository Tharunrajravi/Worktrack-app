// Mock local persistence for Phase 1.
//
// ARCHITECTURE NOTE: every function here is async and returns Promises even
// though localStorage is synchronous. That's deliberate — Phase 2 replaces
// this module's internals with fetch() calls to API Gateway/Lambda, and
// callers (React components) should not need to change at all when that
// happens. Keep all localStorage access confined to this file.

import type { WorkItem, WorkSession } from '../types/work';

const ITEMS_KEY = 'worktrack_items_v1';
const SESSIONS_KEY = 'worktrack_sessions_v1';

// One-time migration: earlier builds stored `timer` directly on WorkItem.
// If we find that legacy shape in localStorage, split it into a WorkItem
// (without `timer`) + one WorkSession, so existing local data isn't lost.
interface LegacyTimerState {
  intervals: WorkSession['intervals'];
  firstStartedAt?: string;
  stoppedAt?: string;
}
type LegacyWorkItem = WorkItem & { timer?: LegacyTimerState };

function migrateLegacyItems(raw: LegacyWorkItem[]): { items: WorkItem[]; sessions: WorkSession[] } {
  const items: WorkItem[] = [];
  const sessions: WorkSession[] = [];
  for (const rawItem of raw) {
    const { timer, ...item } = rawItem;
    items.push(item);
    if (timer && timer.intervals.length > 0) {
      sessions.push({
        id: `${item.id}-legacy-session`,
        workItemId: item.id,
        intervals: timer.intervals,
        firstStartedAt: timer.firstStartedAt,
        stoppedAt: timer.stoppedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    }
  }
  return { items, sessions };
}

function readItems(): WorkItem[] {
  const raw = localStorage.getItem(ITEMS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LegacyWorkItem[];
    if (parsed.some((i) => 'timer' in i)) {
      const { items, sessions } = migrateLegacyItems(parsed);
      writeItems(items);
      const existingSessions = readSessions();
      writeSessions([...existingSessions, ...sessions]);
      return items;
    }
    return parsed as WorkItem[];
  } catch {
    return [];
  }
}

function writeItems(items: WorkItem[]): void {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

function readSessions(): WorkSession[] {
  const raw = localStorage.getItem(SESSIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as WorkSession[];
  } catch {
    return [];
  }
}

function writeSessions(sessions: WorkSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export async function listWorkItems(): Promise<WorkItem[]> {
  return readItems().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getWorkItem(id: string): Promise<WorkItem | undefined> {
  return readItems().find((item) => item.id === id);
}

export async function getWorkIdsForDate(date: string): Promise<string[]> {
  return readItems()
    .filter((item) => item.date === date)
    .map((item) => item.workId);
}

export async function saveWorkItem(item: WorkItem): Promise<WorkItem> {
  const items = readItems();
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index >= 0) {
    items[index] = item;
  } else {
    items.push(item);
  }
  writeItems(items);
  return item;
}

export async function deleteWorkItem(id: string): Promise<void> {
  writeItems(readItems().filter((item) => item.id !== id));
  writeSessions(readSessions().filter((session) => session.workItemId !== id));
}

export async function listWorkSessions(): Promise<WorkSession[]> {
  return readSessions();
}

export async function saveWorkSession(session: WorkSession): Promise<WorkSession> {
  const sessions = readSessions();
  const index = sessions.findIndex((existing) => existing.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  writeSessions(sessions);
  return session;
}
