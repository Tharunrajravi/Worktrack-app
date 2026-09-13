// Pure timer logic. No React, no storage, no side effects — this is the
// piece the spec explicitly calls out as needing tests, so it is kept
// isolated and deterministic (every function takes "now" as a parameter
// instead of calling Date.now() internally).
//
// RULE (from product spec): Time Spent = SUM(active work intervals),
// NOT (End Time - Start Time). Paused periods must not count.

import type { DerivedTimerPhase, TimerInterval, TimerState } from '../types/work';

export function startTimer(timer: TimerState, now: Date): TimerState {
  if (timer.stoppedAt) {
    throw new Error('Cannot start a timer that has already been stopped.');
  }
  if (getPhase(timer) === 'running') {
    return timer; // already running — no-op, avoid double-open intervals
  }
  const nowIso = now.toISOString();
  const newInterval: TimerInterval = { start: nowIso };
  return {
    ...timer,
    firstStartedAt: timer.firstStartedAt ?? nowIso,
    intervals: [...timer.intervals, newInterval],
  };
}

export function pauseTimer(timer: TimerState, now: Date): TimerState {
  const phase = getPhase(timer);
  if (phase !== 'running') {
    throw new Error(`Cannot pause a timer in phase "${phase}".`);
  }
  return { ...timer, intervals: closeLastInterval(timer.intervals, now) };
}

export function resumeTimer(timer: TimerState, now: Date): TimerState {
  const phase = getPhase(timer);
  if (phase !== 'paused') {
    throw new Error(`Cannot resume a timer in phase "${phase}".`);
  }
  return { ...timer, intervals: [...timer.intervals, { start: now.toISOString() }] };
}

export function stopTimer(timer: TimerState, now: Date): TimerState {
  const phase = getPhase(timer);
  if (phase === 'not_started' || phase === 'stopped') {
    throw new Error(`Cannot stop a timer in phase "${phase}".`);
  }
  const intervals = phase === 'running' ? closeLastInterval(timer.intervals, now) : timer.intervals;
  return { ...timer, intervals, stoppedAt: now.toISOString() };
}

export function getPhase(timer: TimerState): DerivedTimerPhase {
  if (timer.stoppedAt) return 'stopped';
  if (timer.intervals.length === 0) return 'not_started';
  const last = timer.intervals[timer.intervals.length - 1];
  return last.end === undefined ? 'running' : 'paused';
}

// The one rule everything else depends on: sum of closed interval
// durations, plus (if currently running) the time since the open
// interval's start up to `now`. Never derived from first-start/stop time.
export function computeActiveMs(timer: TimerState, now: Date): number {
  return timer.intervals.reduce((total, interval) => {
    const start = new Date(interval.start).getTime();
    const end = interval.end ? new Date(interval.end).getTime() : now.getTime();
    return total + Math.max(0, end - start);
  }, 0);
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
  const closed: TimerInterval = { ...last, end: now.toISOString() };
  return [...intervals.slice(0, -1), closed];
}
