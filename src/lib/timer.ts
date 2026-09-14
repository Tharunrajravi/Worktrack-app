import type {
  WorkItem,
  WorkSession,
  TimerInterval,
} from '../types/work';


// ============================================================
// Create a local-compatible Work Session
//
// This remains useful for existing tests and local utilities.
// AWS is authoritative when the application is connected.
// ============================================================

export function createWorkSession(
  workItemId: string,
  sessionId: string,
  now: Date,
): WorkSession {
  const nowIso =
    now.toISOString();


  return {
    sessionId,

    workItemId,

    startedAt:
      nowIso,

    activeStartedAt:
      nowIso,

    status:
      'Active',

    intervals: [
      {
        start: nowIso,
      },
    ],

    activeDuration:
      0,

    createdAt:
      nowIso,

    updatedAt:
      nowIso,
  };
}


// ============================================================
// Pause local session
// ============================================================

export function pauseSession(
  session: WorkSession,
  now: Date,
): WorkSession {
  if (
    session.status !==
    'Active'
  ) {
    return session;
  }


  const currentMs =
    computeCurrentActiveMs(
      session,
      now,
    );


  return {
    ...session,

    status:
      'Paused',

    activeDuration:
      currentMs,

    activeStartedAt:
      undefined,

    intervals:
      closeCurrentInterval(
        session.intervals,
        now,
      ),

    updatedAt:
      now.toISOString(),
  };
}


// ============================================================
// Resume local session
// ============================================================

export function resumeSession(
  session: WorkSession,
  now: Date,
): WorkSession {
  if (
    session.status !==
    'Paused'
  ) {
    return session;
  }


  const nowIso =
    now.toISOString();


  return {
    ...session,

    status:
      'Active',

    activeStartedAt:
      nowIso,

    intervals: [
      ...session.intervals,

      {
        start:
          nowIso,
      },
    ],

    updatedAt:
      nowIso,
  };
}


// ============================================================
// Stop local session
// ============================================================

export function stopSession(
  session: WorkSession,
  now: Date,
): WorkSession {
  if (
    session.status !==
    'Active'
  ) {
    return session;
  }


  const currentMs =
    computeCurrentActiveMs(
      session,
      now,
    );


  return {
    ...session,

    status:
      'Ended',

    activeDuration:
      currentMs,

    activeStartedAt:
      undefined,

    endedAt:
      now.toISOString(),

    intervals:
      closeCurrentInterval(
        session.intervals,
        now,
      ),

    updatedAt:
      now.toISOString(),
  };
}


// ============================================================
// Session phase
//
// Backend status is authoritative.
// ============================================================

export type DerivedTimerPhase =
  | 'not_started'
  | 'running'
  | 'paused'
  | 'stopped';


export function getSessionPhase(
  session:
    | WorkSession
    | undefined,
): DerivedTimerPhase {
  if (!session) {
    return 'not_started';
  }


  switch (
    session.status
  ) {
    case 'Active':
      return 'running';

    case 'Paused':
      return 'paused';

    case 'Ended':
      return 'stopped';

    default:
      return 'not_started';
  }
}


// ============================================================
// Current active milliseconds
// ============================================================

function computeCurrentActiveMs(
  session: WorkSession,
  now: Date,
): number {
  const storedMs =
    Number(
      session.activeDuration || 0,
    );


  if (
    session.status !==
      'Active' ||
    !session.activeStartedAt
  ) {
    return storedMs;
  }


  const start =
    new Date(
      session.activeStartedAt,
    ).getTime();


  const current =
    now.getTime();


  if (
    !Number.isFinite(
      start,
    )
  ) {
    return storedMs;
  }


  return Math.max(
    storedMs +
      (current - start),
    storedMs,
  );
}


// ============================================================
// Public session duration
//
// IMPORTANT:
// Returns MILLISECONDS.
// ============================================================

export function computeSessionActiveMs(
  session: WorkSession,
  now: Date,
): number {
  return computeCurrentActiveMs(
    session,
    now,
  );
}


// ============================================================
// Work Item total
// ============================================================

export function computeWorkItemActiveMs(
  item: WorkItem,
  now: Date,
): number {
  return item.sessions.reduce(
    (
      total,
      session,
    ) =>
      total +
      computeSessionActiveMs(
        session,
        now,
      ),
    0,
  );
}


// ============================================================
// Active session
//
// Only an AWS Active session counts as active.
// Paused sessions must NOT be returned here.
// ============================================================

export function getActiveSession(
  item: WorkItem,
): WorkSession | undefined {
  return item.sessions.find(
    (session) =>
      session.status ===
      'Active',
  );
}


// ============================================================
// Resumable Work Item
//
// Planned / In Progress / Blocked can be continued.
// Completed cannot.
// ============================================================

export function isResumable(
  item: WorkItem,
): boolean {
  if (
    item.status ===
    'Completed'
  ) {
    return false;
  }


  /*
   * A Work Item with an active session cannot be resumed
   * because that session is already running.
   */
  if (
    getActiveSession(item)
  ) {
    return false;
  }


  return true;
}


// ============================================================
// Close current timer interval
// ============================================================

function closeCurrentInterval(
  intervals: TimerInterval[],
  now: Date,
): TimerInterval[] {
  if (
    intervals.length ===
    0
  ) {
    return intervals;
  }


  const lastIndex =
    intervals.length - 1;


  const last =
    intervals[lastIndex];


  if (last.end) {
    return intervals;
  }


  return intervals.map(
    (
      interval,
      index,
    ) =>
      index ===
      lastIndex
        ? {
            ...interval,
            end:
              now.toISOString(),
          }
        : interval,
  );
}


// ============================================================
// Format duration
//
// Input = milliseconds
//
// Example:
// 24,581 ms → 00:00:24
// ============================================================

export function formatDuration(
  milliseconds: number,
): string {
  const totalSeconds =
    Math.floor(
      Math.max(
        0,
        milliseconds,
      ) / 1000,
    );


  const hours =
    Math.floor(
      totalSeconds / 3600,
    );


  const minutes =
    Math.floor(
      (totalSeconds % 3600) /
        60,
    );


  const seconds =
    totalSeconds % 60;


  return [
    String(hours).padStart(
      2,
      '0',
    ),

    String(minutes).padStart(
      2,
      '0',
    ),

    String(seconds).padStart(
      2,
      '0',
    ),
  ].join(':');
}
