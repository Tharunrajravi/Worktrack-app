// Weekly dashboard aggregation — now session-aware. Work is attributed to
// the calendar day it was actually WORKED (a session's start date), not the
// day the item was originally planned, since a multi-day item can now span
// several days of sessions.

import type { WorkItem, WorkSession } from '../types/work';
import { computeActiveMs } from './timer';

export interface DayStat {
  date: string; // yyyy-mm-dd
  label: string; // "Mon", "Tue", ...
  workHours: number;
  learningHours: number;
  completedTasks: number;
  learningSessions: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Monday-start week containing `now`.
export function getCurrentWeekDates(now: Date): string[] {
  const day = now.getDay(); // 0 = Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toIsoDate(d);
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeWeekStats(items: WorkItem[], sessions: WorkSession[], now: Date): DayStat[] {
  const weekDates = getCurrentWeekDates(now);
  const itemById = new Map(items.map((item) => [item.id, item]));

  return weekDates.map((date, i) => {
    let workMs = 0;
    let learningMs = 0;
    let learningSessions = 0;

    for (const session of sessions) {
      if (!session.firstStartedAt) continue;
      if (toIsoDate(new Date(session.firstStartedAt)) !== date) continue;
      const item = itemById.get(session.workItemId);
      if (!item) continue;
      const activeMs = computeActiveMs(session, now);
      if (item.category === 'Learning') {
        learningMs += activeMs;
        learningSessions += 1;
      } else {
        workMs += activeMs;
      }
    }

    const completedTasks = items.filter((item) => item.date === date && item.status === 'Completed').length;

    return {
      date,
      label: DAY_LABELS[i],
      workHours: round2(workMs / 3_600_000),
      learningHours: round2(learningMs / 3_600_000),
      completedTasks,
      learningSessions,
    };
  });
}
