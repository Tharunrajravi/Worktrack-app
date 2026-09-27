// Core domain types for WorkTrack.
//
// IMPORTANT DESIGN NOTE (matches product spec):
// - "Work Plan" fields (intent) and "Work Track" fields (status/outcome/notes)
//   live on WorkItem. Execution — when work actually happened — lives on a
//   separate WorkSession. One WorkItem can have many WorkSessions: stopping a
//   session does NOT complete the item, and starting again reuses the same
//   Work ID instead of minting a new one.
// - Time Spent is NEVER stored as a plain number the user can edit. A
//   session's active time is always derived from its `intervals` (see
//   lib/timer.ts); a work item's total active time is always derived by
//   summing every one of its sessions (see lib/sessions.ts). This keeps
//   "planned vs actual" honest and makes future backend persistence of
//   authoritative timer state straightforward.

export type WorkStatus = 'Planned' | 'In Progress' | 'Blocked' | 'Completed';

export type WorkPriority = 'Low' | 'Medium' | 'High' | 'Critical';

// V1 uses a single primary category per item, per spec.
export type WorkCategory =
  | 'Development'
  | 'DevOps'
  | 'Cloud'
  | 'Incident'
  | 'Deployment'
  | 'Troubleshooting'
  | 'Meeting'
  | 'Documentation'
  | 'Learning';

export interface WorkLink {
  id: string;
  type: string; // e.g. "Jira", "GitHub", "Confluence", "CloudWatch" — free text, not hardcoded fields
  url: string;
}

// A single continuous stretch of active (unpaused) work within one session.
// `end` is undefined while that interval is still running.
export interface TimerInterval {
  start: string; // ISO timestamp
  end?: string; // ISO timestamp, undefined = currently active
}

// The pause/resume state machine's shape. A WorkSession *is* one of these
// (plus id/workItemId) — see WorkSession below. lib/timer.ts's functions
// operate on this shape directly, so they work unchanged whether they used
// to be called on an item's embedded timer or, now, on a session.
export interface TimerState {
  intervals: TimerInterval[];
  // Set once, on that session's first START press.
  firstStartedAt?: string;
  // Set once, on STOP. Once set, that session cannot be resumed — but the
  // WorkItem it belongs to is untouched and a new session can start later.
  stoppedAt?: string;
}

export type DerivedTimerPhase = 'not_started' | 'running' | 'paused' | 'stopped';

// WORK ITEM — "what am I working on?" Never carries execution state.
export interface WorkItem {
  id: string; // internal unique id (uuid) — stable DB key
  workId: string; // human-readable WT-YYYYMMDD-NNN, stable for the item's whole life

  // --- Work Plan fields (intent) ---
  date: string; // ISO date (yyyy-mm-dd) — when the plan was originally created
  project: string;
  client?: string;
  environment?: string;
  category?: WorkCategory;
  taskTitle: string;
  description: string;
  priority: WorkPriority;
  technologies: string[];
  ticketId?: string;
  links: WorkLink[];

  // --- Work Track fields (what actually happened, item-level) ---
  // Stopping a session never changes this on its own — only an explicit
  // Complete/Block action does.
  status: WorkStatus;
  outcome?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

// WORK SESSION — "when did I actually work on it?" One WorkItem can have
// many. Reuses the TimerState shape so lib/timer.ts needs no changes.
export interface WorkSession extends TimerState {
  id: string;
  workItemId: string;
  createdAt: string;
  updatedAt: string;
}

export const WORK_STATUSES: WorkStatus[] = ['Planned', 'In Progress', 'Blocked', 'Completed'];
export const WORK_PRIORITIES: WorkPriority[] = ['Low', 'Medium', 'High', 'Critical'];
export const WORK_CATEGORIES: WorkCategory[] = [
  'Development',
  'DevOps',
  'Cloud',
  'Incident',
  'Deployment',
  'Troubleshooting',
  'Meeting',
  'Documentation',
  'Learning',
];

// Resumable = can start another session under this item without unblocking
// it first. Only an explicit Complete makes an item non-resumable.
export function isResumableStatus(status: WorkStatus): boolean {
  return status !== 'Completed';
}
