// Mock local persistence for Phase 1.
//
// ARCHITECTURE NOTE: every function here is async and returns Promises even
// though localStorage is synchronous. That's deliberate — Phase 2 replaces
// this module's internals with fetch() calls to API Gateway/Lambda, and
// callers (React components) should not need to change at all when that
// happens. Keep all localStorage access confined to this file.

import type { WorkItem } from '../types/work';

const ITEMS_KEY = 'worktrack_items_v1';

function readAll(): WorkItem[] {
  const raw = localStorage.getItem(ITEMS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as WorkItem[];
  } catch {
    return [];
  }
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
  return readAll()
    .filter((item) => item.date === date)
    .map((item) => item.workId);
}

export async function saveWorkItem(item: WorkItem): Promise<WorkItem> {
  const items = readAll();
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index >= 0) {
    items[index] = item;
  } else {
    items.push(item);
  }
  writeAll(items);
  return item;
}

export async function deleteWorkItem(id: string): Promise<void> {
  writeAll(readAll().filter((item) => item.id !== id));
}
