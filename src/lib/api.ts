import type { WorkItem, WorkSession } from '../types/work';

const API_BASE_URL = (
  import.meta.env.VITE_WORKTRACK_API_URL ||
  'https://s021u9plb0.execute-api.ap-south-1.amazonaws.com'
).replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let data: unknown = undefined;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message: unknown }).message)
        : `WorkTrack API request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export async function apiListWorkItems(): Promise<WorkItem[]> {
  const result = await request<{ items?: WorkItem[] }>('/work-items');
  return result.items ?? [];
}

export async function apiGetWorkItem(workId: string): Promise<WorkItem | undefined> {
  try {
    return await request<WorkItem>(`/work-items/${encodeURIComponent(workId)}`);
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('not found')) {
      return undefined;
    }
    throw error;
  }
}

export async function apiCreateWorkItem(item: WorkItem): Promise<WorkItem> {
  return request<WorkItem>('/work-items', {
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
      incidentId: item.incidentId,
      outcome: item.outcome,
      notes: item.notes,
      links: item.links,
    }),
  });
}

export async function apiUpdateWorkItem(item: WorkItem): Promise<WorkItem> {
  return request<WorkItem>(`/work-items/${encodeURIComponent(item.workId)}`, {
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
      incidentId: item.incidentId,
      outcome: item.outcome,
      notes: item.notes,
      links: item.links,
    }),
  });
}

export async function apiListWorkSessions(): Promise<WorkSession[]> {
  const items = await apiListWorkItems();
  return items.flatMap((item) => item.sessions ?? []);
}

export async function apiStartSession(workId: string): Promise<WorkSession> {
  return request<WorkSession>(`/work-items/${encodeURIComponent(workId)}/sessions`, {
    method: 'POST',
  });
}

export async function apiPauseSession(workId: string, sessionId: string): Promise<WorkSession> {
  return request<WorkSession>(
    `/work-items/${encodeURIComponent(workId)}/sessions/${encodeURIComponent(sessionId)}/pause`,
    { method: 'POST' },
  );
}

export async function apiResumeSession(workId: string, sessionId: string): Promise<WorkSession> {
  return request<WorkSession>(
    `/work-items/${encodeURIComponent(workId)}/sessions/${encodeURIComponent(sessionId)}/resume`,
    { method: 'POST' },
  );
}

export async function apiStopSession(workId: string, sessionId: string): Promise<WorkSession> {
  return request<WorkSession>(
    `/work-items/${encodeURIComponent(workId)}/sessions/${encodeURIComponent(sessionId)}/stop`,
    { method: 'POST' },
  );
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
