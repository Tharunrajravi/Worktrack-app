import type {
  WorkItem,
  WorkSession,
} from '../types/work';

const API_BASE_URL =
  'https://s021u9plb0.execute-api.ap-south-1.amazonaws.com';


// ============================================================
// Backend session shape
// ============================================================

interface BackendWorkSession {
  sessionId: string;

  workId: string;

  startedAt: string;

  activeStartedAt?: string | null;

  endedAt?: string | null;

  status:
    | 'Active'
    | 'Paused'
    | 'Ended';

  activeDuration: number;

  createdAt: string;

  updatedAt: string;
}


// ============================================================
// Generic API request
// ============================================================

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,

      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    },
  );


  const text =
    await response.text();


  let data: unknown;


  try {
    data = text
      ? JSON.parse(text)
      : null;
  } catch {
    throw new Error(
      `API returned invalid JSON (${response.status})`,
    );
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
// Normalize backend session
// ============================================================

function normalizeSession(
  session: BackendWorkSession,
): WorkSession {
  const endedAt =
    session.endedAt ?? undefined;


  const activeStartedAt =
    session.activeStartedAt ?? undefined;


  /*
   * Build the interval representation expected by the
   * existing frontend timer utilities.
   *
   * The IMPORTANT fields are status, activeDuration and
   * activeStartedAt, which now come directly from AWS.
   */
  const intervals = [
    {
      start: session.startedAt,

      ...(endedAt
        ? { end: endedAt }
        : {}),
    },
  ];


  return {
    sessionId:
      session.sessionId,

    workItemId:
      session.workId,

    startedAt:
      session.startedAt,

    endedAt,

    status:
      session.status,

    activeDuration:
      Number(
        session.activeDuration ?? 0,
      ),

    activeStartedAt,

    intervals,

    createdAt:
      session.createdAt,

    updatedAt:
      session.updatedAt,
  };
}


// ============================================================
// Load Work Item + Sessions
// ============================================================

async function loadWorkItemWithSessions(
  item: WorkItem,
): Promise<WorkItem> {
  const result =
    await request<{
      count: number;
      sessions:
        BackendWorkSession[];
    }>(
      `/work-items/${encodeURIComponent(
        item.workId,
      )}/sessions`,
    );


  return {
    ...item,

    id:
      item.id ||
      item.workId,

    sessions:
      result.sessions.map(
        normalizeSession,
      ),
  };
}


// ============================================================
// Work Items
// ============================================================

export async function apiListWorkItems(): Promise<
  WorkItem[]
> {
  const result =
    await request<{
      count: number;
      items: WorkItem[];
    }>('/work-items');


  const items =
    await Promise.all(
      result.items.map(
        loadWorkItemWithSessions,
      ),
    );


  return items.sort(
    (a, b) =>
      b.createdAt.localeCompare(
        a.createdAt,
      ),
  );
}


export async function apiGetWorkItem(
  workId: string,
): Promise<WorkItem> {
  const item =
    await request<WorkItem>(
      `/work-items/${encodeURIComponent(
        workId,
      )}`,
    );


  return loadWorkItemWithSessions(
    item,
  );
}


// ============================================================
// Create Work Item
// ============================================================

export async function apiCreateWorkItem(
  item: WorkItem,
): Promise<WorkItem> {
  const created =
    await request<WorkItem>(
      '/work-items',
      {
        method: 'POST',

        body: JSON.stringify({
          project:
            item.project,

          client:
            item.client,

          environment:
            item.environment,

          category:
            item.category,

          taskTitle:
            item.taskTitle,

          description:
            item.description,

          priority:
            item.priority,

          technologies:
            item.technologies,

          ticketId:
            item.ticketId,

          incidentId:
            item.incidentId,

          links:
            item.links,

          status:
            item.status,
        }),
      },
    );


  return {
    ...created,

    id:
      created.id ||
      created.workId,

    sessions: [],
  };
}


// ============================================================
// Update Work Item
// ============================================================

export async function apiUpdateWorkItem(
  workId: string,
  updates: Partial<WorkItem>,
): Promise<WorkItem> {
  const updated =
    await request<WorkItem>(
      `/work-items/${encodeURIComponent(
        workId,
      )}`,
      {
        method: 'PATCH',

        body: JSON.stringify(
          updates,
        ),
      },
    );


  return loadWorkItemWithSessions(
    updated,
  );
}


// ============================================================
// Sessions
// ============================================================

export async function apiListSessions(
  workId: string,
): Promise<WorkSession[]> {
  const result =
    await request<{
      count: number;
      sessions:
        BackendWorkSession[];
    }>(
      `/work-items/${encodeURIComponent(
        workId,
      )}/sessions`,
    );


  return result.sessions.map(
    normalizeSession,
  );
}


export async function apiStartSession(
  workId: string,
): Promise<WorkSession> {
  const session =
    await request<BackendWorkSession>(
      `/work-items/${encodeURIComponent(
        workId,
      )}/sessions`,
      {
        method: 'POST',
      },
    );


  return normalizeSession(
    session,
  );
}


export async function apiPauseSession(
  workId: string,
  sessionId: string,
): Promise<WorkSession> {
  const session =
    await request<BackendWorkSession>(
      `/work-items/${encodeURIComponent(
        workId,
      )}/sessions/${encodeURIComponent(
        sessionId,
      )}/pause`,
      {
        method: 'POST',
      },
    );


  return normalizeSession(
    session,
  );
}


export async function apiResumeSession(
  workId: string,
  sessionId: string,
): Promise<WorkSession> {
  const session =
    await request<BackendWorkSession>(
      `/work-items/${encodeURIComponent(
        workId,
      )}/sessions/${encodeURIComponent(
        sessionId,
      )}/resume`,
      {
        method: 'POST',
      },
    );


  return normalizeSession(
    session,
  );
}


export async function apiStopSession(
  workId: string,
  sessionId: string,
): Promise<WorkSession> {
  const session =
    await request<BackendWorkSession>(
      `/work-items/${encodeURIComponent(
        workId,
      )}/sessions/${encodeURIComponent(
        sessionId,
      )}/stop`,
      {
        method: 'POST',
      },
    );


  return normalizeSession(
    session,
  );
}


// ============================================================
// Weekly Dashboard
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
  const params =
    new URLSearchParams({
      startDate,
      endDate,
    });


  return request<WeeklyDashboard>(
    `/dashboard/weekly?${params.toString()}`,
  );
}
