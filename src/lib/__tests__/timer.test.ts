import { describe, expect, it } from 'vitest';
import {
  computeActiveMs,
  formatDuration,
  getPhase,
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
} from '../timer';
import type { TimerState } from '../../types/work';

const empty: TimerState = { intervals: [] };

describe('timer phase transitions', () => {
  it('starts as not_started', () => {
    expect(getPhase(empty)).toBe('not_started');
  });

  it('start -> running, pause -> paused, resume -> running, stop -> stopped', () => {
    let t = startTimer(empty, new Date('2026-01-01T11:35:22Z'));
    expect(getPhase(t)).toBe('running');

    t = pauseTimer(t, new Date('2026-01-01T11:50:12Z'));
    expect(getPhase(t)).toBe('paused');

    t = resumeTimer(t, new Date('2026-01-01T12:05:10Z'));
    expect(getPhase(t)).toBe('running');

    t = stopTimer(t, new Date('2026-01-01T12:30:10Z'));
    expect(getPhase(t)).toBe('stopped');
  });

  it('rejects invalid transitions', () => {
    expect(() => pauseTimer(empty, new Date())).toThrow();
    expect(() => resumeTimer(empty, new Date())).toThrow();
    expect(() => stopTimer(empty, new Date())).toThrow();

    const running = startTimer(empty, new Date());
    expect(() => resumeTimer(running, new Date())).toThrow();

    const stopped = stopTimer(running, new Date());
    expect(() => startTimer(stopped, new Date())).toThrow();
    expect(() => pauseTimer(stopped, new Date())).toThrow();
  });

  it('start is a no-op if already running (no double-open intervals)', () => {
    const running = startTimer(empty, new Date('2026-01-01T10:00:00Z'));
    const again = startTimer(running, new Date('2026-01-01T10:05:00Z'));
    expect(again.intervals).toHaveLength(1);
  });
});

describe('computeActiveMs — the core business rule', () => {
  // Exact worked example from the product spec:
  // Start 11:35:22, Pause 11:50:12, Resume 12:05:10, Stop 12:30:10
  // Pause period: 14m58s. Active time: 39m50s.
  // Time Spent = SUM(active intervals), NOT (End - Start).
  it('matches the spec worked example: 39m50s active, not 54m48s wall clock', () => {
    let t = startTimer(empty, new Date('2026-01-01T11:35:22Z'));
    t = pauseTimer(t, new Date('2026-01-01T11:50:12Z'));
    t = resumeTimer(t, new Date('2026-01-01T12:05:10Z'));
    t = stopTimer(t, new Date('2026-01-01T12:30:10Z'));

    const activeMs = computeActiveMs(t, new Date('2026-01-01T12:30:10Z'));
    const expectedMs = (39 * 60 + 50) * 1000;
    expect(activeMs).toBe(expectedMs);
    expect(formatDuration(activeMs)).toBe('00:39:50');

    // Sanity check: wall-clock (End - Start) would have been wrong.
    const wallClockMs =
      new Date('2026-01-01T12:30:10Z').getTime() - new Date('2026-01-01T11:35:22Z').getTime();
    expect(activeMs).not.toBe(wallClockMs);
  });

  it('counts elapsed time on a still-running interval up to "now"', () => {
    const running = startTimer(empty, new Date('2026-01-01T09:00:00Z'));
    const activeMs = computeActiveMs(running, new Date('2026-01-01T09:10:00Z'));
    expect(activeMs).toBe(10 * 60 * 1000);
  });

  it('does not count paused time while paused', () => {
    let t = startTimer(empty, new Date('2026-01-01T09:00:00Z'));
    t = pauseTimer(t, new Date('2026-01-01T09:10:00Z'));
    // 20 minutes pass while paused
    const activeMs = computeActiveMs(t, new Date('2026-01-01T09:30:00Z'));
    expect(activeMs).toBe(10 * 60 * 1000);
  });

  it('sums multiple pause/resume cycles correctly', () => {
    let t = startTimer(empty, new Date('2026-01-01T09:00:00Z')); // +5 min
    t = pauseTimer(t, new Date('2026-01-01T09:05:00Z'));
    t = resumeTimer(t, new Date('2026-01-01T09:15:00Z')); // +10 min
    t = pauseTimer(t, new Date('2026-01-01T09:25:00Z'));
    t = resumeTimer(t, new Date('2026-01-01T09:40:00Z')); // +7 min
    t = stopTimer(t, new Date('2026-01-01T09:47:00Z'));

    expect(computeActiveMs(t, new Date('2026-01-01T09:47:00Z'))).toBe(22 * 60 * 1000);
  });
});

describe('formatDuration', () => {
  it('pads to HH:MM:SS', () => {
    expect(formatDuration(0)).toBe('00:00:00');
    expect(formatDuration(5000)).toBe('00:00:05');
    expect(formatDuration(65000)).toBe('00:01:05');
    expect(formatDuration(3661000)).toBe('01:01:01');
  });
});
