import type { WorkItem, WorkSession, TimerInterval } from '../types/work';

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

type CloudSession = WorkSession & {
  sessionId?: string;
  workId?: string;
  intervals?: TimerInterval[];
  status?: string;
  startedAt?: string;
  activeStartedAt?: string;
  activeDuration?: number;
  endedAt?: string | null;
};

function isoMinusMs(iso: string, durationMs: number): string {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return iso;
  return new Date(time - Math.max(0, durationMs)).toISOString();
}

function normalizeSession(session: CloudSession, workItemId?: string): WorkSession {
  // The Lambda stores timer state as:
  //   startedAt + activeStartedAt + activeDuration + status + endedAt
  // while the React timer engine consumes:
  //   intervals[] + firstStartedAt + stoppedAt.
  // Convert the cloud representation here so the rest of the app can keep
  // using the existing timer/session implementation unchanged.
  let intervals: TimerInterval[];

  if (Array.isArray(session.intervals)) {
    intervals = session.intervals;
  } else {
    const durationMs = Number(session.activeDuration ?? 0) || 0;
    const status = session.status;

    if (status === 'Active' && session.activeStartedAt) {
      intervals = [];

      // activeDuration is time accumulated before the currently-running
      // interval. Represent that accumulated time as a closed interval so
      // totals remain correct after a refresh/resume.
      if (durationMs > 0) {
        intervals.push({
          start: isoMinusMs(session.activeStartedAt, durationMs),
          end: session.activeStartedAt,
        });
      }

      intervals.push({ start: session.activeStartedAt });
    } else if (status === 'Paused') {
      // The backend stores only the aggregate active duration for a paused
      // session. We preserve that exact duration as one closed interval.
      const end = session.updatedAt || session.startedAt || new Date().toISOString();
      intervals = [{ start: isoMinusMs(end, durationMs), end }];
    } else if (status === 'Ended' || session.endedAt) {
      const end = session.endedAt || session.updatedAt || session.startedAt || new Date().toISOString();
      intervals = [{ start: isoMinusMs(end, durationMs), end }];
    } else {
      intervals = [];
    }
  }

  return {
    ...session,
    intervals,
    id: session.id || session.sessionId || '',
    workItemId: workItemId || session.workItemId || session.workId || '',
    firstStartedAt: session.firstStartedAt || session.startedAt,
    stoppedAt: session.stoppedAt || (session.status === 'Ended' ? session.endedAt || undefined : undefined),
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
  // GET /work-items returns only WorkItem records. Sessions are separate
  // DynamoDB entities, so fetch the existing session list for each item.
  const result = await request<{ items?: WorkItem[] }>('/work-items');
  const items = result.items ?? [];

  const sessionLists = await Promise.all(
    items.map(async (item) => {
      const workId = item.workId;
      if (!workId) return [] as WorkSession[];

      const sessionResult = await request<{ sessions?: CloudSession[] }>(
        `/work-items/${encodeURIComponent(workId)}/sessions`,
      );

      return (sessionResult.sessions ?? []).map((session) =>
        normalizeSession(session, item.id || item.workId),
      );
    }),
  );

  return sessionLists.flat();
}

export async function apiStartSession(workId: string): Promise<WorkSession> {
  const result = await request<CloudSession & { session?: CloudSession }>(
    `/work-items/${encodeURIComponent(workId)}/sessions`,
    { method: 'POST' },
  );
  return normalizeSession(result.session ?? result, workId);
}

async function sessionAction(workId: string, sessionId: string, action: 'pause' | 'resume' | 'stop'): Promise<WorkSession> {
  const result = await request<CloudSession & { session?: CloudSession }>(
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
