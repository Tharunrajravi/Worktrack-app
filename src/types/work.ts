export type WorkStatus =
  | 'Planned'
  | 'In Progress'
  | 'Blocked'
  | 'Completed';

export type WorkPriority =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical';

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
  type: string;
  url: string;
}


export interface TimerInterval {
  start: string;
  end?: string;
}


/*
 * Legacy/local timer state.
 *
 * Kept for compatibility with the existing local storage
 * implementation and existing tests.
 */
export interface TimerState {
  intervals: TimerInterval[];
  firstStartedAt?: string;
  stoppedAt?: string;
}


export type WorkSessionStatus =
  | 'Active'
  | 'Paused'
  | 'Ended';


export interface WorkSession {
  sessionId: string;

  workItemId: string;

  startedAt: string;

  endedAt?: string;

  /*
   * AWS-authoritative session state.
   */
  status: WorkSessionStatus;

  /*
   * Total accumulated ACTIVE duration.
   *
   * Unit: milliseconds.
   */
  activeDuration: number;

  /*
   * Present while the session is actively running.
   */
  activeStartedAt?: string;

  /*
   * Retained for compatibility with the existing
   * frontend timer utilities.
   */
  intervals: TimerInterval[];

  createdAt: string;

  updatedAt: string;
}


export interface WorkItem {
  id: string;

  workId: string;

  date: string;

  project: string;

  client?: string;

  environment?: string;

  category?: WorkCategory;

  taskTitle: string;

  description: string;

  priority: WorkPriority;

  technologies: string[];

  ticketId?: string;

  incidentId?: string;

  links: WorkLink[];

  status: WorkStatus;

  sessions: WorkSession[];

  outcome?: string;

  notes?: string;

  createdAt: string;

  updatedAt: string;
}


export const WORK_STATUSES: WorkStatus[] = [
  'Planned',
  'In Progress',
  'Blocked',
  'Completed',
];


export const WORK_PRIORITIES: WorkPriority[] = [
  'Low',
  'Medium',
  'High',
  'Critical',
];


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
