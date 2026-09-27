import { useEffect, useState } from 'react';
import { listWorkItems, listWorkSessions, saveWorkItem, saveWorkSession } from '../lib/storage';
import { pauseTimer, resumeTimer, startTimer, stopTimer, getPhase } from '../lib/timer';
import { findOpenSession, sessionsForItem } from '../lib/sessions';
import type { WorkItem, WorkSession, WorkStatus } from '../types/work';

export function useWorkTrackData() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listWorkItems(), listWorkSessions()]).then(([allItems, allSessions]) => {
      setItems(allItems);
      setSessions(allSessions);
      setLoading(false);
    });
  }, []);

  const persistItem = async (item: WorkItem) => {
    const updated = { ...item, updatedAt: new Date().toISOString() };
    await saveWorkItem(updated);
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
    return updated;
  };

  const persistSession = async (session: WorkSession) => {
    const updated = { ...session, updatedAt: new Date().toISOString() };
    await saveWorkSession(updated);
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
    return updated;
  };

  // System-wide: only one open (running/paused) session at a time.
  const openSession = findOpenSession(sessions);
  const openItem = openSession ? items.find((i) => i.id === openSession.workItemId) : undefined;

  const createItem = async (item: WorkItem) => persistItem(item);

  // START on an item — works identically whether it's brand-new (no prior
  // sessions) or an existing In Progress/Blocked item being resumed. Either
  // way: reuse the same Work ID, create a NEW WorkSession, never touch old
  // sessions.
  const startSession = async (item: WorkItem) => {
    if (findOpenSession(sessions)) return; // concurrency guard: one active session system-wide
    const now = new Date();
    const sessionId = `${item.id}-session-${now.getTime()}`;
    const fresh = startTimer({ intervals: [] }, now);
    await persistSession({
      id: sessionId,
      workItemId: item.id,
      intervals: fresh.intervals,
      firstStartedAt: fresh.firstStartedAt,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    if (item.status === 'Planned' || item.status === 'Blocked') {
      await persistItem({ ...item, status: 'In Progress' });
    }
  };

  const pauseSession = (session: WorkSession) => persistSession(pauseTimer(session, new Date()) as WorkSession);
  const resumeSession = (session: WorkSession) => persistSession(resumeTimer(session, new Date()) as WorkSession);

  // STOP — ends the session only. The item's status is untouched here; per
  // product rule, stopping a session never implies completion.
  const stopSession = (session: WorkSession) => persistSession(stopTimer(session, new Date()) as WorkSession);

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
