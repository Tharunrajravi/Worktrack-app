import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import WorkPlanForm from '../components/WorkPlanForm';
import TimerCard from '../components/TimerCard';
import SessionSummary from '../components/SessionSummary';
import ProgressChart from '../components/ProgressChart';
import ExportModal from '../components/ExportModal';
import { generateWorkId } from '../lib/id';
import { getWorkIdsForDate, listWorkItems, saveWorkItem } from '../lib/storage';
import { computeActiveMs, formatDuration, pauseTimer, resumeTimer, startTimer, stopTimer, getPhase } from '../lib/timer';
import { computeWeekStats } from '../lib/stats';
import type { WorkItem, WorkStatus } from '../types/work';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [nextWorkId, setNextWorkId] = useState<string | null>(null);
  const [summaryItemId, setSummaryItemId] = useState<string | null>(null);
  const [selectedChartDate, setSelectedChartDate] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    listWorkItems().then((all) => {
      setItems(all);
      setLoading(false);
    });
  }, []);

  const today = todayIso();
  const todayItems = useMemo(
    () => items.filter((i) => i.date === today).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [items, today],
  );
  const activeItem = todayItems.find((i) => {
    const phase = getPhase(i.timer);
    return phase === 'running' || phase === 'paused';
  });
  const summaryItem = items.find((i) => i.id === summaryItemId) ?? null;
  const weekStats = useMemo(() => computeWeekStats(items, new Date()), [items]);
  const completedToday = todayItems.filter((i) => i.status === 'Completed').length;

  const persist = async (item: WorkItem) => {
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
  };

  const openPlanForm = async () => {
    const existingIds = await getWorkIdsForDate(today);
    setNextWorkId(generateWorkId(new Date(), existingIds));
    setShowPlanForm(true);
  };

  const handleCreate = async (item: WorkItem) => {
    await persist(item);
    setShowPlanForm(false);
  };

  const handleStart = (item: WorkItem) => persist({ ...item, status: 'In Progress', timer: startTimer(item.timer, new Date()) });
  const handlePause = (item: WorkItem) => persist({ ...item, timer: pauseTimer(item.timer, new Date()) });
  const handleResume = (item: WorkItem) => persist({ ...item, timer: resumeTimer(item.timer, new Date()) });
  const handleStop = (item: WorkItem) => {
    persist({ ...item, timer: stopTimer(item.timer, new Date()) }).then(() => setSummaryItemId(item.id));
  };

  const handleSaveSummary = (updates: { status: WorkStatus; outcome?: string; notes?: string }) => {
    if (!summaryItem) return;
    persist({ ...summaryItem, ...updates }).then(() => setSummaryItemId(null));
  };

  if (loading) return null;

  return (
    <div>
      <div
        className="dashboard-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}
      >
        <div>
          <h1 style={{ fontSize: 26 }}>
            {greeting()}
            {user ? `, ${user.displayName}` : ''}
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 5 }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {todayItems.length > 0 && (
              <span style={{ color: 'var(--text-faint)' }}>
                {' '}
                · {completedToday}/{todayItems.length} completed today
              </span>
            )}
          </div>
        </div>
        <div className="dashboard-header-actions" style={{ display: 'flex', gap: 10 }}>
          <button onClick={openPlanForm} className="btn btn-primary">
            Set Today's Work Plan
          </button>
          <button onClick={() => setShowExport(true)} className="btn btn-secondary">
            Export Work Tracking
          </button>
        </div>
      </div>

      <section style={{ marginBottom: 28 }}>
        <div className="section-heading">This week</div>
        <div className="panel" style={{ padding: '20px 22px' }}>
          <ProgressChart data={weekStats} selectedDate={selectedChartDate} onSelectDay={setSelectedChartDate} />
        </div>
      </section>

      {activeItem && (
        <section style={{ marginBottom: 28 }}>
          <div className="section-heading">Active session</div>
          <TimerCard
            item={activeItem}
            onStart={() => handleStart(activeItem)}
            onPause={() => handlePause(activeItem)}
            onResume={() => handleResume(activeItem)}
            onStop={() => handleStop(activeItem)}
          />
        </section>
      )}

      <section>
        <div className="section-heading">Today's work</div>
        {todayItems.length === 0 ? (
          <EmptyState onCreate={openPlanForm} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayItems.map((item) => (
              <PlanRow
                key={item.id}
                item={item}
                disableStart={Boolean(activeItem) && activeItem?.id !== item.id}
                onStart={() => handleStart(item)}
              />
            ))}
          </div>
        )}
      </section>

      {showPlanForm && nextWorkId && (
        <WorkPlanForm workId={nextWorkId} date={today} onCancel={() => setShowPlanForm(false)} onCreate={handleCreate} />
      )}
      {summaryItem && <SessionSummary item={summaryItem} onSave={handleSaveSummary} />}
      {showExport && <ExportModal items={items} defaultDate={today} onClose={() => setShowExport(false)} />}
    </div>
  );
}

function PlanRow({ item, onStart, disableStart }: { item: WorkItem; onStart: () => void; disableStart: boolean }) {
  const phase = getPhase(item.timer);
  const isActive = phase === 'running' || phase === 'paused';
  return (
    <div className={`work-row ${isActive ? 'work-row-active' : ''}`}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
            {item.workId}
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{item.project}</span>
          {item.environment && (
            <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>· {item.environment}</span>
          )}
        </div>
        <div style={{ fontWeight: 600, marginTop: 3 }}>{item.taskTitle}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <PriorityTag priority={item.priority} />
        <StatusPill status={item.status} />
        {phase !== 'not_started' && (
          <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            {formatDuration(computeActiveMs(item.timer, new Date()))}
          </span>
        )}
        {phase === 'not_started' && (
          <button onClick={onStart} disabled={disableStart} className="btn btn-primary btn-sm">
            Start
          </button>
        )}
      </div>
    </div>
  );
}

function PriorityTag({ priority }: { priority: WorkItem['priority'] }) {
  if (priority !== 'Critical' && priority !== 'High') return null;
  return (
    <span className={`badge ${priority === 'Critical' ? 'badge-blocked' : 'badge-paused'}`}>
      <span className="badge-dot" aria-hidden />
      {priority}
    </span>
  );
}

function StatusPill({ status }: { status: WorkStatus }) {
  const badgeClass = status === 'Blocked' ? 'badge-blocked' : status === 'In Progress' ? 'badge-running' : 'badge-neutral';
  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" aria-hidden />
      {status}
    </span>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="empty-state">
      <div style={{ marginBottom: 14 }}>No work planned yet.</div>
      <button onClick={onCreate} className="btn btn-primary">
        Set Today's Work Plan
      </button>
    </div>
  );
}
