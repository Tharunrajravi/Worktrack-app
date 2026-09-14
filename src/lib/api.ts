import type { WorkItem, WorkSession } from '../types/work';

const API_BASE_URL =
  'https://s021u9plb0.execute-api.ap-south-1.amazonaws.com';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();

  let data: unknown;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`API returned invalid JSON (${response.status})`);
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : `API request failed (${response.status})`;

    throw new Error(message);
  }

  return data as T;
}


// ============================================================
// Work Items
// ============================================================

export async function apiListWorkItems(): Promise<WorkItem[]> {
  const result = await request<{ count: number; items: WorkItem[] }>(
    '/work-items',
  );

  return result.items;
}


export async function apiGetWorkItem(
  workId: string,
): Promise<WorkItem> {
  return request<WorkItem>(
    `/work-items/${encodeURIComponent(workId)}`,
  );
}


export async function apiCreateWorkItem(
  item: WorkItem,
): Promise<WorkItem> {
  return request<WorkItem>('/work-items', {
    method: 'POST',
    body: JSON.stringify({
      project: item.project,
      client: item.client,
      environment: item.environment,
      category: item.category,
      taskTitle: item.taskTitle,
      description: item.description,
      priority: item.priority,
      technologies: item.technologies,
      ticketId: item.ticketId,
      links: item.links,
      status: item.status,
    }),
  });
}


export async function apiUpdateWorkItem(
  workId: string,
  updates: Partial<WorkItem>,
): Promise<WorkItem> {
  return request<WorkItem>(
    `/work-items/${encodeURIComponent(workId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    },
  );
}


// ============================================================
// Sessions
// ============================================================

export async function apiListSessions(
  workId: string,
): Promise<WorkSession[]> {
  const result = await request<{
    count: number;
    sessions: WorkSession[];
  }>(
    `/work-items/${encodeURIComponent(workId)}/sessions`,
  );

  return result.sessions;
}


export async function apiStartSession(
  workId: string,
): Promise<WorkSession> {
  return request<WorkSession>(
    `/work-items/${encodeURIComponent(workId)}/sessions`,
    {
      method: 'POST',
    },
  );
}


export async function apiPauseSession(
  workId: string,
  sessionId: string,
): Promise<WorkSession> {
  return request<WorkSession>(
    `/work-items/${encodeURIComponent(workId)}/sessions/${encodeURIComponent(sessionId)}/pause`,
    {
      method: 'POST',
    },
  );
}


export async function apiResumeSession(
  workId: string,
  sessionId: string,
): Promise<WorkSession> {
  return request<WorkSession>(
    `/work-items/${encodeURIComponent(workId)}/sessions/${encodeURIComponent(sessionId)}/resume`,
    {
      method: 'POST',
    },
  );
}


export async function apiStopSession(
  workId: string,
  sessionId: string,
): Promise<WorkSession> {
  return request<WorkSession>(
    `/work-items/${encodeURIComponent(workId)}/sessions/${encodeURIComponent(sessionId)}/stop`,
    {
      method: 'POST',
    },
  );
}


// ============================================================
// Dashboard
// ============================================================

export interface WeeklyDashboard {
  startDate: string;
  endDate: string;
  totalWorkHours: number;
  completedTasks: number;
  totalLearningTime: number;
  totalLearningSessions: number;
  days: Array<{
    date: string;
    workHours: number;
    learningTime: number;
    completedTasks: number;
    learningSessions: number;
  }>;
}


export async function apiGetWeeklyDashboard(
  startDate: string,
  endDate: string,
): Promise<WeeklyDashboard> {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  return request<WeeklyDashboard>(
    `/dashboard/weekly?${params.toString()}`,
  );
}
