import { useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import WorkPlanForm from '../components/WorkPlanForm';
import TimerCard from '../components/TimerCard';
import SessionSummary from '../components/SessionSummary';
import ProgressChart from '../components/ProgressChart';
import ExportModal from '../components/ExportModal';
import { generateWorkId } from '../lib/id';
import { getWorkIdsForDate, listWorkItems, saveWorkItem } from '../lib/storage';
import { computeWorkItemActiveMs, createWorkSession, formatDuration, getActiveSession, isResumable, pauseSession, resumeSession, stopSession } from '../lib/timer';
import { computeWeekStats } from '../lib/stats';
import type { WorkItem, WorkStatus } from '../types/work';

function todayIso() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'; }
const rank: Record<WorkStatus, number> = { 'In Progress': 0, Blocked: 1, Planned: 2, Completed: 3 };

export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChooser, setShowChooser] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [nextWorkId, setNextWorkId] = useState<string | null>(null);
  const [summaryItemId, setSummaryItemId] = useState<string | null>(null);
  const [selectedChartDate, setSelectedChartDate] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => { listWorkItems().then((all) => { setItems(all); setLoading(false); }); }, []);
  const today = todayIso();
  const activeItem = items.find((item) => getActiveSession(item));
  const todayItems = useMemo(() => items.filter((i) => i.date === today).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [items, today]);
  const summaryItem = items.find((i) => i.id === summaryItemId) ?? null;
  const resumable = items.filter(isResumable).sort((a, b) => rank[a.status] - rank[b.status] || b.updatedAt.localeCompare(a.updatedAt));
  const filteredResumable = resumable.filter((item) => `${item.workId} ${item.taskTitle} ${item.project} ${item.status}`.toLowerCase().includes(query.toLowerCase()));
  const completedToday = todayItems.filter((i) => i.status === 'Completed').length;
  const weekStats = useMemo(() => computeWeekStats(items, new Date()), [items]);

  const persist = async (item: WorkItem) => {
    const updated = { ...item, updatedAt: new Date().toISOString() };
    await saveWorkItem(updated);
    setItems((previous) => previous.map((i) => i.id === updated.id ? updated : i).concat(previous.some((i) => i.id === updated.id) ? [] : [updated]));
  };
  const openNewPlan = async () => { const ids = await getWorkIdsForDate(today); setNextWorkId(generateWorkId(new Date(), ids)); setShowChooser(false); setShowPlanForm(true); };
  const startOrContinue = (item: WorkItem) => {
    if (activeItem && activeItem.id !== item.id) return;
    if (getActiveSession(item)) return;
    persist({ ...item, status: 'In Progress', sessions: [...item.sessions, createWorkSession(item.id, uuid(), new Date())] });
    setShowChooser(false);
  };
  useEffect(() => {
    const id = (location.state as { continueItemId?: string } | null)?.continueItemId;
    const item = items.find((candidate) => candidate.id === id);
    if (item && isResumable(item) && !activeItem) startOrContinue(item);
  // location state is intentionally consumed only after data has loaded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, loading]);

  const updateActive = (item: WorkItem, update: (session: NonNullable<ReturnType<typeof getActiveSession>>) => NonNullable<ReturnType<typeof getActiveSession>>) => {
    const active = getActiveSession(item); if (!active) return;
    persist({ ...item, sessions: item.sessions.map((session) => session.sessionId === active.sessionId ? update(session) : session) });
  };
  const handleStop = (item: WorkItem) => {
    updateActive(item, (session) => stopSession(session, new Date()));
    setSummaryItemId(item.id);
  };

  if (loading) return null;
  return <div>
    <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
      <div><h1 style={{ fontSize: 26 }}>{greeting()}{user ? `, ${user.displayName}` : ''}</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 5 }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}{todayItems.length > 0 && <span style={{ color: 'var(--text-faint)' }}> · {completedToday}/{todayItems.length} completed today</span>}</div></div>
      <div className="dashboard-header-actions" style={{ display: 'flex', gap: 10 }}><button onClick={() => setShowChooser(true)} className="btn btn-primary">Set Today's Work Plan</button><button onClick={() => setShowExport(true)} className="btn btn-secondary">Export Work Tracking</button></div>
    </div>
    <section style={{ marginBottom: 28 }}><div className="section-heading">This week</div><div className="panel" style={{ padding: '20px 22px' }}><ProgressChart data={weekStats} selectedDate={selectedChartDate} onSelectDay={setSelectedChartDate} /></div></section>
    {activeItem && <section style={{ marginBottom: 28 }}><div className="section-heading">Active session</div><TimerCard item={activeItem} onPause={() => updateActive(activeItem, (s) => pauseSession(s, new Date()))} onResume={() => updateActive(activeItem, (s) => resumeSession(s, new Date()))} onStop={() => handleStop(activeItem)} /></section>}
    <section><div className="section-heading">Today's work</div>{todayItems.length === 0 ? <EmptyState onCreate={() => setShowChooser(true)} /> : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{todayItems.map((item) => <PlanRow key={item.id} item={item} disabled={activeItem ? activeItem.id !== item.id : false} onContinue={() => startOrContinue(item)} />)}</div>}</section>
    {showChooser && <div className="overlay overlay-center" role="dialog" aria-modal="true" aria-labelledby="work-choice-title"><div className="modal" style={{ width: 580 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 id="work-choice-title" style={{ fontSize: 18 }}>Set Today's Work Plan</h2><button onClick={() => setShowChooser(false)} className="btn btn-ghost btn-sm" aria-label="Close">Close</button></div><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Create a new task or continue an existing Work Item with the same Work ID.</p><div style={{ display: 'flex', gap: 10, marginBottom: 18 }}><button onClick={openNewPlan} className="btn btn-primary">Create New Work Plan</button></div><div className="form-section-title">Continue Previous Work</div><input className="input" aria-label="Search resumable work" placeholder="Search Work ID, task, project, or status" value={query} onChange={(e) => setQuery(e.target.value)} />{filteredResumable.length === 0 ? <div style={{ color: 'var(--text-muted)', marginTop: 14 }}>No resumable work items found.</div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>{filteredResumable.map((item) => <button key={item.id} onClick={() => startOrContinue(item)} disabled={Boolean(activeItem)} className="work-row" style={{ textAlign: 'left', color: 'inherit' }}><span><span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{item.workId}</span><span style={{ fontWeight: 600, display: 'block' }}>{item.taskTitle}</span><span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.project} · {item.status}</span></span><span className="mono">{formatDuration(computeWorkItemActiveMs(item, new Date()))}</span></button>)}</div>}</div></div>}
    {showPlanForm && nextWorkId && <WorkPlanForm workId={nextWorkId} date={today} onCancel={() => setShowPlanForm(false)} onCreate={(item) => { persist(item); setShowPlanForm(false); }} />}
    {summaryItem && <SessionSummary item={summaryItem} onSave={(updates) => { persist({ ...summaryItem, ...updates }); setSummaryItemId(null); }} />}
    {showExport && <ExportModal items={items} defaultDate={today} onClose={() => setShowExport(false)} />}
  </div>;
}

function PlanRow({ item, disabled, onContinue }: { item: WorkItem; disabled: boolean; onContinue: () => void }) {
  const active = getActiveSession(item);
  return <div className={`work-row ${active ? 'work-row-active' : ''}`}><div><span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{item.workId}</span><div style={{ fontWeight: 600 }}>{item.taskTitle}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span className="badge badge-neutral">{item.status}</span><span className="mono">{formatDuration(computeWorkItemActiveMs(item, new Date()))}</span>{isResumable(item) && <button onClick={onContinue} disabled={disabled} className="btn btn-primary btn-sm">{item.sessions.length ? 'Continue' : 'Start'}</button>}</div></div>;
}
function EmptyState({ onCreate }: { onCreate: () => void }) { return <div className="empty-state"><div style={{ marginBottom: 14 }}>No work planned yet.</div><button onClick={onCreate} className="btn btn-primary">Set Today's Work Plan</button></div>; }
