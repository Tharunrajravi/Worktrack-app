import { useEffect, useState } from 'react';
import {
  apiCreateWorkItem,
  apiListWorkItems,
  apiListWorkSessions,
  apiPauseSession,
  apiResumeSession,
  apiStartSession,
  apiStopSession,
  apiUpdateWorkItem,
} from '../lib/api';
import { pauseTimer, resumeTimer, startTimer, stopTimer, getPhase } from '../lib/timer';
import { findOpenSession, sessionsForItem } from '../lib/sessions';
import type { WorkItem, WorkSession, WorkStatus } from '../types/work';

export function useWorkTrackData() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiListWorkItems(), apiListWorkSessions()])
      .then(([allItems, allSessions]) => {
        setItems(allItems);
        setSessions(allSessions);
      })
      .finally(() => setLoading(false));
  }, []);

  const persistItem = async (item: WorkItem) => {
    const updated = { ...item, updatedAt: new Date().toISOString() };
    const saved = await apiUpdateWorkItem(updated);
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id || i.workId === item.workId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...saved, id: saved.id || item.id, workId: saved.workId || item.workId };
        return next;
      }
      return [...prev, { ...saved, id: saved.id || item.id, workId: saved.workId || item.workId }];
    });
    return { ...saved, id: saved.id || item.id, workId: saved.workId || item.workId };
  };

  const persistSession = async (session: WorkSession) => {
    const workItem = items.find((item) => item.id === session.workItemId || item.workId === session.workItemId);
    if (!workItem) throw new Error('Work Item not found.');

    const existing = sessions.find((s) => s.id === session.id);
    let saved: WorkSession;

    if (!existing) {
      saved = await apiStartSession(workItem.workId);
    } else if (session.stoppedAt && !existing.stoppedAt) {
      saved = await apiStopSession(workItem.workId, existing.id);
    } else {
      const wasRunning = existing.intervals.some((interval) => !interval.end);
      const isRunning = session.intervals.some((interval) => !interval.end);
      if (wasRunning && !isRunning) {
        saved = await apiPauseSession(workItem.workId, existing.id);
      } else if (!wasRunning && isRunning) {
        saved = await apiResumeSession(workItem.workId, existing.id);
      } else {
        saved = existing;
      }
    }

    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    return saved;
  };

  const openSession = findOpenSession(sessions);
  const openItem = openSession ? items.find((i) => i.id === openSession.workItemId || i.workId === openSession.workItemId) : undefined;

  const createItem = async (item: WorkItem) => {
    const created = await apiCreateWorkItem(item);
    const normalized = { ...created, id: created.id || item.id, workId: created.workId || item.workId };
    setItems((prev) => [...prev, normalized]);
    return normalized;
  };

  const startSession = async (item: WorkItem) => {
    if (findOpenSession(sessions)) return;
    const saved = await apiStartSession(item.workId);
    setSessions((prev) => [...prev, saved]);

    if (item.status === 'Planned' || item.status === 'Blocked') {
      const updated = await apiUpdateWorkItem({ ...item, status: 'In Progress', updatedAt: new Date().toISOString() });
      setItems((prev) => prev.map((i) => (i.id === item.id || i.workId === item.workId ? { ...updated, id: updated.id || item.id, workId: updated.workId || item.workId } : i)));
    }
  };

  const pauseSession = async (session: WorkSession) => persistSession(pauseTimer(session, new Date()) as WorkSession);
  const resumeSession = async (session: WorkSession) => persistSession(resumeTimer(session, new Date()) as WorkSession);
  const stopSession = async (session: WorkSession) => persistSession(stopTimer(session, new Date()) as WorkSession);

  const saveItemUpdates = (item: WorkItem, updates: { status: WorkStatus; outcome?: string; notes?: string }) =>
    persistItem({ ...item, ...updates });

  const getSessionsForItem = (workItemId: string) => sessionsForItem(sessions, workItemId);

  const isItemRunning = (item: WorkItem) => {
    const session = findOpenSession(getSessionsForItem(item.id));
    return session ? getPhase(session) : null;
  };

  return {
    items,
    sessions,
    loading,
    openSession,
    openItem,
    createItem,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    saveItemUpdates,
    getSessionsForItem,
    isItemRunning,
  };
}
