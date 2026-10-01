import type { WorkItem, WorkSession } from '../types/work';

const API_BASE_URL = (
  import.meta.env.VITE_WORKTRACK_API_URL ||
  'https://s021u9plb0.execute-api.ap-south-1.amazonaws.com'
).replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });

  const text = await response.text();
  let data: unknown;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'message' in data
      ? String((data as { message: unknown }).message)
      : `WorkTrack API request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

function normalizeWorkItem(item: WorkItem): WorkItem {
  return { ...item, id: item.id || item.workId };
}

function normalizeSession(session: WorkSession & { sessionId?: string; workId?: string }, workItemId?: string): WorkSession {
  return {
    ...session,
    id: session.id || session.sessionId || '',
    workItemId: workItemId || session.workItemId || session.workId || '',
  };
}

export async function apiListWorkItems(): Promise<WorkItem[]> {
  const result = await request<{ items?: WorkItem[] }>('/work-items');
  return (result.items ?? []).map((item) => ({
    ...normalizeWorkItem(item),
    sessions: undefined,
  } as WorkItem));
}

export async function apiGetWorkItem(workId: string): Promise<WorkItem | undefined> {
  try {
    const item = await request<WorkItem & { sessions?: WorkSession[] }>(`/work-items/${encodeURIComponent(workId)}`);
    const normalized = normalizeWorkItem(item);
    return { ...normalized, sessions: undefined } as WorkItem;
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('not found')) return undefined;
    throw error;
  }
}

export async function apiCreateWorkItem(item: WorkItem): Promise<WorkItem> {
  const created = await request<WorkItem>('/work-items', {
    method: 'POST',
    body: JSON.stringify({
      project: item.project,
      client: item.client,
      environment: item.environment,
      category: item.category,
      taskTitle: item.taskTitle,
      description: item.description,
      status: item.status,
      priority: item.priority,
      technologies: item.technologies,
      ticketId: item.ticketId,
      outcome: item.outcome,
      notes: item.notes,
      links: item.links,
    }),
  });
  return { ...item, ...created, id: created.id || item.id, workId: created.workId || item.workId };
}

export async function apiUpdateWorkItem(item: WorkItem): Promise<WorkItem> {
  const updated = await request<WorkItem>(`/work-items/${encodeURIComponent(item.workId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      project: item.project,
      client: item.client,
      environment: item.environment,
      category: item.category,
      taskTitle: item.taskTitle,
      description: item.description,
      status: item.status,
      priority: item.priority,
      technologies: item.technologies,
      ticketId: item.ticketId,
      outcome: item.outcome,
      notes: item.notes,
      links: item.links,
    }),
  });
  return { ...item, ...updated, id: updated.id || item.id, workId: updated.workId || item.workId };
}

export async function apiListWorkSessions(): Promise<WorkSession[]> {
  const result = await request<{ items?: Array<WorkItem & { sessions?: WorkSession[] }> }>('/work-items');
  return (result.items ?? []).flatMap((item) =>
    (item.sessions ?? []).map((session) => normalizeSession(session, item.id || item.workId)),
  );
}

export async function apiStartSession(workId: string): Promise<WorkSession> {
  const result = await request<WorkSession & { session?: WorkSession }>(
    `/work-items/${encodeURIComponent(workId)}/sessions`,
    { method: 'POST' },
  );
  return normalizeSession(result.session ?? result, workId);
}

async function sessionAction(workId: string, sessionId: string, action: 'pause' | 'resume' | 'stop'): Promise<WorkSession> {
  const result = await request<WorkSession & { session?: WorkSession }>(
    `/work-items/${encodeURIComponent(workId)}/sessions/${encodeURIComponent(sessionId)}/${action}`,
    { method: 'POST' },
  );
  return normalizeSession(result.session ?? result, workId);
}

export function apiPauseSession(workId: string, sessionId: string): Promise<WorkSession> {
  return sessionAction(workId, sessionId, 'pause');
}

export function apiResumeSession(workId: string, sessionId: string): Promise<WorkSession> {
  return sessionAction(workId, sessionId, 'resume');
}

export function apiStopSession(workId: string, sessionId: string): Promise<WorkSession> {
  return sessionAction(workId, sessionId, 'stop');
}

export interface ExportResponse {
  fileName: string;
  downloadUrl: string;
  expiresIn: number;
  rowCount: number;
}

export async function apiExportWorkItems(startDate: string, endDate: string): Promise<ExportResponse> {
  const params = new URLSearchParams({ startDate, endDate });
  return request<ExportResponse>(`/work-items/export?${params.toString()}`);
}
