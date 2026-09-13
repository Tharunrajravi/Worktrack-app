import { describe, expect, it } from 'vitest';
import { computeSessionActiveMs, computeWorkItemActiveMs, createWorkSession, pauseSession, resumeSession, stopSession } from '../timer';
import type { WorkItem } from '../../types/work';

describe('Work Item sessions', () => {
  it('stops a session without completing the Work Item and creates a second session on continuation', () => {
    const start = new Date('2026-09-13T10:30:00Z');
    let first = createWorkSession('item-1', 'session-1', start);
    first = stopSession(first, new Date('2026-09-13T11:20:00Z'));
    const item: WorkItem = { id: 'item-1', workId: 'WT-20260913-001', date: '2026-09-13', project: 'WorkTrack', taskTitle: 'Develop app', description: 'Build', priority: 'Medium', technologies: [], links: [], status: 'In Progress', sessions: [first], createdAt: start.toISOString(), updatedAt: start.toISOString() };
    const second = stopSession(createWorkSession(item.id, 'session-2', new Date('2026-09-13T14:10:00Z')), new Date('2026-09-13T15:00:00Z'));
    const continued = { ...item, sessions: [...item.sessions, second] };
    expect(continued.workId).toBe('WT-20260913-001');
    expect(continued.status).toBe('In Progress');
    expect(continued.sessions).toHaveLength(2);
    expect(computeWorkItemActiveMs(continued, new Date('2026-09-13T15:00:00Z'))).toBe(100 * 60 * 1000);
  });
  it('excludes paused time within a session', () => {
    let session = createWorkSession('item-1', 'session-1', new Date('2026-09-13T10:00:00Z'));
    session = pauseSession(session, new Date('2026-09-13T10:10:00Z'));
    session = resumeSession(session, new Date('2026-09-13T10:30:00Z'));
    session = stopSession(session, new Date('2026-09-13T10:40:00Z'));
    expect(computeSessionActiveMs(session, new Date('2026-09-13T10:40:00Z'))).toBe(20 * 60 * 1000);
  });
});
