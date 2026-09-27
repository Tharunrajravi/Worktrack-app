// Aggregation over a WorkItem's WorkSessions. Kept separate from lib/timer.ts
// (which knows about a single session's interval state machine) so each file
// has one job: timer.ts = one session's state machine, sessions.ts = how many
// sessions add up to an item's totals.

import type { WorkSession } from '../types/work';
import { computeActiveMs, getPhase } from './timer';

// Total active time across every session belonging to one item.
export function computeItemActiveMs(sessions: WorkSession[], now: Date): number {
  return sessions.reduce((total, session) => total + computeActiveMs(session, now), 0);
}

// A work item must never have more than one running/paused session at once
// (system-wide, per the concurrency rule) — but as a pure lookup this just
// finds the (at most one) session of THIS item that is currently open.
export function findOpenSession(sessions: WorkSession[]): WorkSession | undefined {
  return sessions.find((s) => {
    const phase = getPhase(s);
    return phase === 'running' || phase === 'paused';
  });
}

export function sessionsForItem(allSessions: WorkSession[], workItemId: string): WorkSession[] {
  return allSessions
    .filter((s) => s.workItemId === workItemId)
    .sort((a, b) => (a.firstStartedAt ?? a.createdAt).localeCompare(b.firstStartedAt ?? b.createdAt));
}

// Most recent moment any interval of any (ended) session touched — used for
// "Last worked at" in the Continue Previous Work list.
export function lastWorkedAt(sessions: WorkSession[]): Date | null {
  let latest: number | null = null;
  for (const session of sessions) {
    for (const interval of session.intervals) {
      const t = new Date(interval.end ?? interval.start).getTime();
      if (latest === null || t > latest) latest = t;
    }
  }
  return latest === null ? null : new Date(latest);
}
