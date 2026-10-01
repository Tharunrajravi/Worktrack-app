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
  return item.workId
    ? apiUpdateWorkItem(item)
    : apiCreateWorkItem(item);
}

export async function deleteWorkItem(_id: string): Promise<void> {
  throw new Error('Deleting Work Items is not supported by the current WorkTrack API.');
}

export async function listWorkSessions(): Promise<WorkSession[]> {
  return apiListWorkSessions();
}

export async function saveWorkSession(session: WorkSession): Promise<WorkSession> {
  const workId = session.workItemId || session.workId;
  if (!workId) throw new Error('A Work Item ID is required to save a session.');

  if (!session.id) {
    return apiStartSession(workId);
  }

  const current = await apiGetWorkItem(workId);
  const existing = current?.sessions?.find((item) => item.id === session.id);
  if (!existing) return apiStartSession(workId);

  if (session.stoppedAt && !existing.stoppedAt) {
    return apiStopSession(workId, session.id);
  }

  const existingRunning = existing.intervals?.some((interval) => !interval.end);
  const requestedRunning = session.intervals?.some((interval) => !interval.end);

  if (existingRunning && !requestedRunning) {
    return apiPauseSession(workId, session.id);
  }

  if (!existingRunning && requestedRunning) {
    return apiResumeSession(workId, session.id);
  }

  return session;
}
