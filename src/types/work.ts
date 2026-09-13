// Core domain types for WorkTrack.
//
// IMPORTANT DESIGN NOTE (matches product spec):
// - "Work Plan" fields (intent) and "Work Track" fields (what actually happened)
//   live on the same WorkItem record but are conceptually distinct: the plan
//   fields are filled in up front, the track/timer fields are only populated
//   once the user actually starts working.
// - Time Spent is NEVER stored as a plain number the user can edit. It is
//   always derived from `timer.intervals` (see lib/timer.ts). This keeps the
//   "planned vs actual" distinction honest and makes future backend
//   persistence of authoritative timer state straightforward: the frontend
//   can just replay the same interval list it gets from the server.

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

// A single continuous stretch of active (unpaused) work.
// `end` is undefined while that interval is still running.
export interface TimerInterval {
  start: string; // ISO timestamp
  end?: string; // ISO timestamp, undefined = currently active
}

export interface TimerState {
  intervals: TimerInterval[];
  // Set once, on the very first START press. Distinct from any individual
  // interval's start — this is "when work on this item first began".
  firstStartedAt?: string;
  // Set once, on STOP. Once set, the timer cannot be resumed.
  stoppedAt?: string;
}

export type DerivedTimerPhase = 'not_started' | 'running' | 'paused' | 'stopped';

export interface WorkSession {
  sessionId: string;
  workItemId: string;
  startedAt: string;
  endedAt?: string;
  intervals: TimerInterval[];
  activeDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkItem {
  id: string; // internal unique id (uuid) — stable DB key
  workId: string; // human-readable WT-YYYYMMDD-NNN
  date: string; // ISO date (yyyy-mm-dd), set when the plan is created

  // --- Work Plan fields (intent) ---
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

  // --- Work Track fields (what actually happened) ---
  status: WorkStatus;
  sessions: WorkSession[];
  outcome?: string;
  notes?: string;

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
