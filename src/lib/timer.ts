import type { DerivedTimerPhase, TimerInterval, WorkItem, WorkSession } from '../types/work';

export function createWorkSession(workItemId: string, sessionId: string, now: Date): WorkSession {
  const nowIso = now.toISOString();
  return { sessionId, workItemId, startedAt: nowIso, intervals: [{ start: nowIso }], activeDuration: 0, createdAt: nowIso, updatedAt: nowIso };
}

export function pauseSession(session: WorkSession, now: Date): WorkSession {
  if (getSessionPhase(session) !== 'running') throw new Error('Cannot pause a timer that is not running.');
  return withDuration({ ...session, intervals: closeLastInterval(session.intervals, now), updatedAt: now.toISOString() }, now);
}

export function resumeSession(session: WorkSession, now: Date): WorkSession {
  if (getSessionPhase(session) !== 'paused') throw new Error('Cannot resume a timer that is not paused.');
  return withDuration({ ...session, intervals: [...session.intervals, { start: now.toISOString() }], updatedAt: now.toISOString() }, now);
}

export function stopSession(session: WorkSession, now: Date): WorkSession {
  const phase = getSessionPhase(session);
  if (phase === 'stopped') throw new Error('Cannot stop a timer that is already stopped.');
  const intervals = phase === 'running' ? closeLastInterval(session.intervals, now) : session.intervals;
  return withDuration({ ...session, intervals, endedAt: now.toISOString(), updatedAt: now.toISOString() }, now);
}

export function getSessionPhase(session: WorkSession): Exclude<DerivedTimerPhase, 'not_started'> {
  if (session.endedAt) return 'stopped';
  return session.intervals[session.intervals.length - 1].end === undefined ? 'running' : 'paused';
}

export function computeSessionActiveMs(session: WorkSession, now: Date): number {
  return session.intervals.reduce((total, interval) => {
    const start = new Date(interval.start).getTime();
    const end = interval.end ? new Date(interval.end).getTime() : now.getTime();
    return total + Math.max(0, end - start);
  }, 0);
}

export function computeWorkItemActiveMs(item: WorkItem, now: Date): number {
  return item.sessions.reduce((total, session) => total + computeSessionActiveMs(session, now), 0);
}

export function getActiveSession(item: WorkItem): WorkSession | undefined {
  return item.sessions.find((session) => {
    const phase = getSessionPhase(session);
    return phase === 'running' || phase === 'paused';
  });
}

export function isResumable(item: WorkItem): boolean {
  return item.status !== 'Completed' && !getActiveSession(item);
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function closeLastInterval(intervals: TimerInterval[], now: Date): TimerInterval[] {
  const last = intervals[intervals.length - 1];
  return [...intervals.slice(0, -1), { ...last, end: now.toISOString() }];
}

function withDuration(session: WorkSession, now: Date): WorkSession {
  return { ...session, activeDuration: computeSessionActiveMs(session, now) };
}
