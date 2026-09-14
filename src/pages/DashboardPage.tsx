import { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ExportModal from '../components/ExportModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ProgressChart from '../components/ProgressChart';
import SessionSummary from '../components/SessionSummary';
import TimerCard from '../components/TimerCard';
import WorkItemRow from '../components/WorkItemRow';
import WorkPlanForm from '../components/WorkPlanForm';
import { useModalAccessibility } from '../components/useModalAccessibility';
import { generateWorkId } from '../lib/id';
import { getWorkIdsForDate, listWorkItems, saveWorkItem } from '../lib/storage';
import { createWorkSession, getActiveSession, isResumable, pauseSession, resumeSession, stopSession } from '../lib/timer';
import { computeWeekStats } from '../lib/stats';
import type { WorkItem, WorkStatus } from '../types/work';

const rank: Record<WorkStatus, number> = { 'In Progress': 0, Blocked: 1, Planned: 2, Completed: 3 };

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChooser, setShowChooser] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [nextWorkId, setNextWorkId] = useState<string | null>(null);
  const [summaryItemId, setSummaryItemId] = useState<string | null>(null);
  const [selectedChartDate, setSelectedChartDate] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listWorkItems());
    } catch {
      setError('Work data could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadItems(); }, []);

  const today = todayIso();
  const activeItem = items.find((item) => getActiveSession(item));
  const todayItems = useMemo(() => items.filter((item) => item.date === today).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [items, today]);
  const resumable = useMemo(() => items.filter(isResumable).sort((a, b) => rank[a.status] - rank[b.status] || b.updatedAt.localeCompare(a.updatedAt)), [items]);
  const summaryItem = items.find((item) => item.id === summaryItemId) ?? null;
  const completedToday = todayItems.filter((item) => item.status === 'Completed').length;
  const weekStats = useMemo(() => computeWeekStats(items, new Date()), [items]);

  const persist = async (item: WorkItem) => {
    const updated = { ...item, updatedAt: new Date().toISOString() };
    setError(null);
    try {
      await saveWorkItem(updated);
      setItems((previous) => {
        const found = previous.some((current) => current.id === updated.id);
        return previous.map((current) => current.id === updated.id ? updated : current).concat(found ? [] : [updated]);
      });
      return true;
    } catch {
      setError('Your latest change could not be saved. Please retry.');
      return false;
    }
  };

  const openNewPlan = async () => {
    try {
      const ids = await getWorkIdsForDate(today);
      setNextWorkId(generateWorkId(new Date(), ids));
      setShowChooser(false);
      setShowPlanForm(true);
    } catch {
      setError('A new Work Item could not be prepared. Please retry.');
    }
  };

  const startOrContinue = async (item: WorkItem) => {
    if ((activeItem && activeItem.id !== item.id) || getActiveSession(item)) return;
    const saved = await persist({
      ...item,
      status: 'In Progress',
      sessions: [...item.sessions, createWorkSession(item.id, uuid(), new Date())],
    });
    if (saved) setShowChooser(false);
  };

  useEffect(() => {
    const id = (location.state as { continueItemId?: string } | null)?.continueItemId;
    const item = items.find((candidate) => candidate.id === id);
    if (item && isResumable(item) && !activeItem) void startOrContinue(item);
    // Location state is intentionally handled after items load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, loading]);

  const updateActive = async (item: WorkItem, update: (session: NonNullable<ReturnType<typeof getActiveSession>>) => NonNullable<ReturnType<typeof getActiveSession>>) => {
    const active = getActiveSession(item);
    if (!active) return false;
    return persist({ ...item, sessions: item.sessions.map((session) => session.sessionId === active.sessionId ? update(session) : session) });
  };

  const handleStop = async (item: WorkItem) => {
    const saved = await updateActive(item, (session) => stopSession(session, new Date()));
    if (saved) setSummaryItemId(item.id);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div>
      <header className="page-header dashboard-header">
        <div>
          <h1>{greeting()}{user ? `, ${user.displayName}` : ''}</h1>
          <p>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}{todayItems.length > 0 && <> · {completedToday}/{todayItems.length} completed today</>}</p>
        </div>
        <div className="dashboard-header-actions">
          <button onClick={() => setShowChooser(true)} className="btn btn-primary">Set Today's Work Plan</button>
          <button onClick={() => setShowExport(true)} className="btn btn-secondary">Export Work Tracking</button>
        </div>
      </header>

      {error && <ErrorNotice message={error} onRetry={loadItems} />}

      {activeItem && (
        <section className="dashboard-section dashboard-active">
          <div className="section-heading">Active Session</div>
          <TimerCard
            item={activeItem}
            onPause={() => void updateActive(activeItem, (session) => pauseSession(session, new Date()))}
            onResume={() => void updateActive(activeItem, (session) => resumeSession(session, new Date()))}
            onStop={() => void handleStop(activeItem)}
          />
        </section>
      )}

      <section className="dashboard-section">
        <div className="section-heading">Today's Work</div>
        {todayItems.length === 0 ? (
          <div className="empty-state">
            <div>No work planned yet.</div>
            <button onClick={() => setShowChooser(true)} className="btn btn-primary">Set Today's Work Plan</button>
          </div>
        ) : (
          <div className="work-item-list">
            {todayItems.map((item) => (
              <WorkItemRow
                key={item.id}
                item={item}
                disabled={Boolean(activeItem && activeItem.id !== item.id)}
                onContinue={() => void startOrContinue(item)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="section-heading">This Week</div>
        <div className="panel chart-panel">
          <ProgressChart data={weekStats} selectedDate={selectedChartDate} onSelectDay={setSelectedChartDate} />
        </div>
      </section>

      {showChooser && <WorkPlanChooser items={resumable} active={Boolean(activeItem)} onClose={() => setShowChooser(false)} onCreate={openNewPlan} onContinue={startOrContinue} />}
      {showPlanForm && nextWorkId && <WorkPlanForm workId={nextWorkId} date={today} onCancel={() => setShowPlanForm(false)} onCreate={(item) => { void persist(item).then((saved) => saved && setShowPlanForm(false)); }} />}
      {summaryItem && <SessionSummary item={summaryItem} onSave={(updates) => { void persist({ ...summaryItem, ...updates }).then((saved) => saved && setSummaryItemId(null)); }} />}
      {showExport && <ExportModal items={items} defaultDate={today} onClose={() => setShowExport(false)} />}
    </div>
  );
}

function WorkPlanChooser({ items, active, onClose, onCreate, onContinue }: { items: WorkItem[]; active: boolean; onClose: () => void; onCreate: () => void; onContinue: (item: WorkItem) => void }) {
  const [query, setQuery] = useState('');
  const createRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useModalAccessibility(onClose, createRef);
  const matches = items.filter((item) => `${item.workId} ${item.taskTitle} ${item.project} ${item.status}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="overlay overlay-center">
      <div ref={dialogRef} className="modal modal-chooser" role="dialog" aria-modal="true" aria-labelledby="work-choice-title" tabIndex={-1}>
        <div className="modal-header">
          <div><p className="eyebrow">Work planning</p><h2 id="work-choice-title">Set Today's Work Plan</h2></div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close work planning">×</button>
        </div>
        <div className="chooser-routes">
          <button ref={createRef} onClick={onCreate} className="chooser-route chooser-route-primary">
            <span className="chooser-route-icon" aria-hidden>+</span>
            <span><strong>Create New Work Item</strong><small>Plan a distinct task and assign a new Work ID.</small></span>
          </button>
          <div className="chooser-route-label">Continue Previous Work</div>
        </div>
        <p className="chooser-help">Continuing creates a new session under the same Work ID.</p>
        <label className="sr-only" htmlFor="resumable-search">Search resumable work</label>
        <input id="resumable-search" className="input" placeholder="Search Work ID, task, project, or status" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="work-item-list chooser-results">
          {matches.length === 0 ? <div className="empty-state empty-state-compact">No resumable Work Items found.</div> : matches.map((item) => <WorkItemRow key={item.id} item={item} compact disabled={active} onContinue={() => void onContinue(item)} />)}
        </div>
      </div>
    </div>
  );
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="error-notice" role="alert"><span>{message}</span><button className="btn btn-secondary btn-sm" onClick={() => void onRetry()}>Retry</button></div>;
}
