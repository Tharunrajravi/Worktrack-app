import type { WorkItem } from '../types/work';
import { computeWorkItemActiveMs } from './timer';

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

export function computeWeekStats(items: WorkItem[], now: Date): DayStat[] {
  const weekDates = getCurrentWeekDates(now);

  return weekDates.map((date, i) => {
    const dayItems = items.filter((item) => item.date === date);
    let workMs = 0;
    let learningMs = 0;
    let completedTasks = 0;
    let learningSessions = 0;

    for (const item of dayItems) {
      const activeMs = computeWorkItemActiveMs(item, now);
      if (item.category === 'Learning') {
        learningMs += activeMs;
        learningSessions += 1;
      } else {
        workMs += activeMs;
      }
      if (item.status === 'Completed') completedTasks += 1;
    }

    return {
      date,
      label: DAY_LABELS[i],
      workHours: Math.round((workMs / 3_600_000) * 100) / 100,
      learningHours: Math.round((learningMs / 3_600_000) * 100) / 100,
      completedTasks,
      learningSessions,
    };
  });
}
