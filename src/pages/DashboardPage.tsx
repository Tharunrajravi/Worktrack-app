import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import WorkPlanForm from '../components/WorkPlanForm';
import PlanChooserModal from '../components/PlanChooserModal';
import ContinueWorkList from '../components/ContinueWorkList';
import TimerCard from '../components/TimerCard';
import SessionSummary from '../components/SessionSummary';
import ProgressChart from '../components/ProgressChart';
import ExportModal from '../components/ExportModal';
import WorkTrackLogo from '../components/WorkTrackLogo';
import { useWorkTrackData } from '../hooks/useWorkTrackData';
import { generateWorkId } from '../lib/id';
import { getWorkIdsForDate } from '../lib/storage';
import { formatDuration, getPhase } from '../lib/timer';
import { computeItemActiveMs } from '../lib/sessions';
import { computeWeekStats } from '../lib/stats';
import type { WorkItem, WorkSession, WorkStatus } from '../types/work';

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

type PlanFlow = 'none' | 'chooser' | 'create' | 'continue';

export default function DashboardPage() {
  const { user } = useAuth();
  const {
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
  } = useWorkTrackData();

  const [planFlow, setPlanFlow] = useState<PlanFlow>('none');
  const [nextWorkId, setNextWorkId] = useState<string | null>(null);
  const [summarySession, setSummarySession] = useState<{ item: WorkItem; session: WorkSession } | null>(null);
  const [selectedChartDate, setSelectedChartDate] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const today = todayIso();
  const dashboardItems = useMemo(
    () =>
      items
        .filter((i) => i.date === today || i.status === 'In Progress' || i.status === 'Blocked')
        .sort((a, b) => {
          if (a.id === openItem?.id) return -1;
          if (b.id === openItem?.id) return 1;
          return b.updatedAt.localeCompare(a.updatedAt);
        }),
    [items, today, openItem],
  );
  const weekStats = useMemo(() => computeWeekStats(items, sessions, new Date()), [items, sessions]);
  const completedToday = items.filter((i) => i.date === today && i.status === 'Completed').length;

  const openPlanChooser = () => setPlanFlow('chooser');

  const handleChooseCreateNew = async () => {
    const existingIds = await getWorkIdsForDate(today);
    setNextWorkId(generateWorkId(new Date(), existingIds));
    setPlanFlow('create');
  };

  const handleCreate = async (item: WorkItem) => {
    await createItem(item);
    setPlanFlow('none');
  };

  const handleContinueSelect = async (item: WorkItem) => {
    setPlanFlow('none');
    await startSession(item);
  };

  const handleStop = async (item: WorkItem, session: WorkSession) => {
    const stopped = await stopSession(session);
    setSummarySession({ item, session: stopped });
  };

  const handleSaveSummary = async (updates: { status: WorkStatus; outcome?: string; notes?: string }) => {
    if (!summarySession) return;
    await saveItemUpdates(summarySession.item, updates);
    setSummarySession(null);
  };

  if (loading) return null;

  return (
    <div>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div className="wt-dashboard-kicker">Your work, in focus</div>
          <h1 className="wt-dashboard-title">
            {greeting()}{user ? `, ${user.displayName}` : ''}
          </h1>
          <div className="wt-dashboard-subtitle">
            Plan the day, track active time, and build a useful history.
            <span style={{ color: 'var(--text-faint)' }}> · {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {completedToday > 0 && <span style={{ color: 'var(--text-faint)' }}> · {completedToday} completed</span>}
          </div>
        </div>
        <div className="dashboard-header-actions" style={{ display: 'flex', gap: 10 }}>
          <button onClick={openPlanChooser} className="btn btn-primary">Set Today's Work Plan</button>
          <button onClick={() => setShowExport(true)} className="btn btn-secondary">Export Work Tracking</button>
        </div>
      </div>

      <section style={{ marginBottom: 28 }}>
        <div className="section-heading">This week</div>
        <div className="panel" style={{ padding: '20px 22px' }}>
          <ProgressChart data={weekStats} selectedDate={selectedChartDate} onSelectDay={setSelectedChartDate} />
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <div className="section-heading">Active work</div>
        {openItem && openSession ? (
          <TimerCard
            item={openItem}
            activeSession={openSession}
            priorActiveMs={computeItemActiveMs(getSessionsForItem(openItem.id).filter((s) => s.id !== openSession.id), new Date())}
            onStart={() => startSession(openItem)}
            onPause={() => pauseSession(openSession)}
            onResume={() => resumeSession(openSession)}
            onStop={() => handleStop(openItem, openSession)}
          />
        ) : (
          <div className="empty-state">
            <div style={{ marginBottom: 14 }}>No active work right now.</div>
            <button onClick={openPlanChooser} className="btn btn-primary">Set Today's Work Plan</button>
          </div>
        )}
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="section-heading" style={{ marginBottom: 0 }}>Today's work</div>
          <WorkTrackLogo size={28} showWordmark={false} compact />
        </div>
        {dashboardItems.length === 0 ? (
          <EmptyState onCreate={openPlanChooser} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dashboardItems.map((item) => (
              <PlanRow
                key={item.id}
                item={item}
                itemSessions={getSessionsForItem(item.id)}
                isOpenItem={item.id === openItem?.id}
                openSession={item.id === openItem?.id ? openSession : undefined}
                disableStart={Boolean(openSession) && item.id !== openItem?.id}
                onStart={() => startSession(item)}
                onPause={() => openSession && pauseSession(openSession)}
                onResume={() => openSession && resumeSession(openSession)}
                onStop={() => openSession && handleStop(item, openSession)}
              />
            ))}
          </div>
        )}
      </section>

      {planFlow === 'chooser' && <PlanChooserModal onCreateNew={handleChooseCreateNew} onContinuePrevious={() => setPlanFlow('continue')} onClose={() => setPlanFlow('none')} />}
      {planFlow === 'create' && nextWorkId && <WorkPlanForm workId={nextWorkId} date={today} onCancel={() => setPlanFlow('none')} onCreate={handleCreate} />}
      {planFlow === 'continue' && <ContinueWorkList items={items} sessions={sessions} onSelect={handleContinueSelect} onClose={() => setPlanFlow('none')} />}
      {summarySession && <SessionSummary item={summarySession.item} session={summarySession.session} onSave={handleSaveSummary} />}
      {showExport && <ExportModal items={items} sessions={sessions} defaultDate={today} onClose={() => setShowExport(false)} />}
    </div>
  );
}

function PlanRow({ item, itemSessions, isOpenItem, openSession, onStart, onPause, onResume, onStop, disableStart }: { item: WorkItem; itemSessions: WorkSession[]; isOpenItem: boolean; openSession: WorkSession | undefined; onStart: () => void; onPause: () => void; onResume: () => void; onStop: () => void; disableStart: boolean }) {
  const totalMs = computeItemActiveMs(itemSessions, new Date());
  const phase = isOpenItem && openSession ? getPhase(openSession) : null;
  const isCompleted = item.status === 'Completed';
  const isResumable = !isCompleted && itemSessions.length > 0;

  return (
    <div className={`work-row ${phase === 'running' || phase === 'paused' ? 'work-row-active' : ''}`}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{item.workId}</span>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{item.project}</span>
          {item.environment && <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>· {item.environment}</span>}
        </div>
        <div style={{ fontWeight: 600, marginTop: 3 }}>{item.taskTitle}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <PriorityTag priority={item.priority} />
        <StatusPill status={item.status} />
        {totalMs > 0 && <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{formatDuration(totalMs)}</span>}
        {phase === 'running' && <><button onClick={onPause} className="btn btn-secondary btn-sm">Pause</button><button onClick={onStop} className="btn btn-danger btn-sm">Stop</button></>}
        {phase === 'paused' && <><button onClick={onResume} className="btn btn-primary btn-sm">Resume</button><button onClick={onStop} className="btn btn-danger btn-sm">Stop</button></>}
        {phase === null && !isCompleted && <button onClick={onStart} disabled={disableStart} className="btn btn-primary btn-sm">{isResumable ? 'Continue' : 'Start'}</button>}
      </div>
    </div>
  );
}

function PriorityTag({ priority }: { priority: WorkItem['priority'] }) {
  if (priority !== 'Critical' && priority !== 'High') return null;
  return <span className={`badge ${priority === 'Critical' ? 'badge-blocked' : 'badge-paused'}`}><span className="badge-dot" aria-hidden />{priority}</span>;
}

function StatusPill({ status }: { status: WorkStatus }) {
  const badgeClass = status === 'Blocked' ? 'badge-blocked' : status === 'In Progress' ? 'badge-running' : 'badge-neutral';
  return <span className={`badge ${badgeClass}`}><span className="badge-dot" aria-hidden />{status}</span>;
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return <div className="empty-state"><div style={{ marginBottom: 14 }}>No work planned yet.</div><button onClick={onCreate} className="btn btn-primary">Set Today's Work Plan</button></div>;
}
