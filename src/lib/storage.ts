import type { WorkItem, WorkSession } from '../types/work';
import {
  apiCreateWorkItem,
  apiGetWorkItem,
  apiListWorkItems,
  apiListWorkSessions,
  apiStartSession,
  apiPauseSession,
  apiResumeSession,
  apiStopSession,
  apiUpdateWorkItem,
} from './api';

export async function listWorkItems(): Promise<WorkItem[]> {
  return apiListWorkItems();
}

export async function getWorkItem(id: string): Promise<WorkItem | undefined> {
  return apiGetWorkItem(id);
}

export async function getWorkIdsForDate(date: string): Promise<string[]> {
  const items = await apiListWorkItems();
  return items.filter((item) => item.date === date).map((item) => item.workId);
}

export async function saveWorkItem(item: WorkItem): Promise<WorkItem> {
  return apiUpdateWorkItem(item);
}

export async function createWorkItem(item: WorkItem): Promise<WorkItem> {
  return apiCreateWorkItem(item);
}

export async function deleteWorkItem(_id: string): Promise<void> {
  throw new Error('Deleting Work Items is not supported by the current WorkTrack API.');
}

export async function listWorkSessions(): Promise<WorkSession[]> {
  return apiListWorkSessions();
}

export async function saveWorkSession(session: WorkSession): Promise<WorkSession> {
  const workItem = await apiGetWorkItem(session.workItemId);
  if (!workItem) throw new Error('Work Item not found.');

  const existing = (await apiListWorkSessions()).find((item) => item.id === session.id);
  if (!existing) return apiStartSession(workItem.workId);

  const wasRunning = existing.intervals.some((interval) => !interval.end);
  const isRunning = session.intervals.some((interval) => !interval.end);

  if (session.stoppedAt && !existing.stoppedAt) return apiStopSession(workItem.workId, existing.id);
  if (wasRunning && !isRunning) return apiPauseSession(workItem.workId, existing.id);
  if (!wasRunning && isRunning) return apiResumeSession(workItem.workId, existing.id);

  return existing;
}
