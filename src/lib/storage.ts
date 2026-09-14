import type {
  TimerState,
  WorkItem,
  WorkSession,
} from '../types/work';


// ============================================================
// Local Storage
//
// This module is retained for compatibility with the original
// frontend implementation.
//
// AWS is now the authoritative persistence layer for the
// Work Track application.
// ============================================================

const WORK_ITEMS_KEY =
  'worktrack.work-items';


function readItems(): WorkItem[] {
  const raw =
    localStorage.getItem(
      WORK_ITEMS_KEY,
    );

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(
      raw,
    ) as WorkItem[];
  } catch {
    return [];
  }
}


function writeItems(
  items: WorkItem[],
) {
  localStorage.setItem(
    WORK_ITEMS_KEY,
    JSON.stringify(items),
  );
}


// ============================================================
// Work Items
// ============================================================

export async function listWorkItems(): Promise<
  WorkItem[]
> {
  return readItems();
}


export async function saveWorkItem(
  item: WorkItem,
): Promise<void> {
  const items =
    readItems();

  const existingIndex =
    items.findIndex(
      (current) =>
        current.id === item.id,
    );

  if (
    existingIndex === -1
  ) {
    writeItems([
      ...items,
      item,
    ]);

    return;
  }

  const updated =
    [...items];

  updated[
    existingIndex
  ] = item;

  writeItems(updated);
}


export async function getWorkIdsForDate(
  date: string,
): Promise<string[]> {
  return readItems()
    .filter(
      (item) =>
        item.date === date,
    )
    .map(
      (item) =>
        item.workId,
    );
}


// ============================================================
// Legacy timer state helpers
// ============================================================

export function getTimerState(
  item: WorkItem,
): TimerState | null {
  const session =
    item.sessions[
      item.sessions.length - 1
    ];

  if (!session) {
    return null;
  }

  return {
    intervals:
      session.intervals,

    firstStartedAt:
      session.startedAt,

    stoppedAt:
      session.endedAt,
  };
}


// ============================================================
// Legacy session constructor
//
// The AWS-backed application should use apiStartSession()
// instead. This exists so the old local implementation and
// tests continue to compile.
// ============================================================

export function createStoredSession(
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

    endedAt:
      undefined,

    status:
      'Active',

    activeDuration:
      0,

    activeStartedAt:
      nowIso,

    intervals: [
      {
        start:
          nowIso,
      },
    ],

    createdAt:
      nowIso,

    updatedAt:
      nowIso,
  };
}
