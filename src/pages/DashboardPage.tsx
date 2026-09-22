import { useEffect, useMemo, useRef, useState } from 'react';
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

import {
  apiCreateWorkItem,
  apiGetWeeklyDashboard,
  apiListWorkItems,
  apiPauseSession,
  apiResumeSession,
  apiStartSession,
  apiStopSession,
  apiUpdateWorkItem,
} from '../lib/api';

import {
  computeWorkItemActiveMs,
  getActiveSession,
  isResumable,
} from '../lib/timer';

import {
  getCurrentWeekDates,
} from '../lib/stats';

import type {
  DayStat,
} from '../lib/stats';

import type {
  WorkItem,
  WorkStatus,
} from '../types/work';


const rank: Record<WorkStatus, number> = {
  'In Progress': 0,
  Blocked: 1,
  Planned: 2,
  Completed: 3,
};


// ============================================================
// Date helpers
// ============================================================

function todayIso(): string {
  const d = new Date();

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1,
  ).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}


function isoDateFromTimestamp(
  timestamp?: string,
): string | null {
  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}


function greeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good Morning';
  }

  if (hour < 17) {
    return 'Good Afternoon';
  }

  return 'Good Evening';
}


// ============================================================
// Duration formatting
// ============================================================

function formatCompactDuration(
  milliseconds: number,
): string {
  const safeMs = Math.max(
    0,
    milliseconds,
  );

  const totalMinutes = Math.floor(
    safeMs / 60000,
  );

  const hours = Math.floor(
    totalMinutes / 60,
  );

  const minutes =
    totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}


// ============================================================
// Determine whether an item had activity today
// ============================================================

function hasActivityToday(
  item: WorkItem,
  today: string,
): boolean {
  if (item.date === today) {
    return true;
  }

  return item.sessions.some(
    (session) =>
      isoDateFromTimestamp(
        session.startedAt,
      ) === today,
  );
}


export default function DashboardPage() {
  const { user } = useAuth();

  const location = useLocation();

  const [items, setItems] =
    useState<WorkItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [showChooser, setShowChooser] =
    useState(false);

  const [showPlanForm, setShowPlanForm] =
    useState(false);

  const [summaryItemId, setSummaryItemId] =
    useState<string | null>(null);

  const [selectedChartDate, setSelectedChartDate] =
    useState<string | null>(null);

  const [showExport, setShowExport] =
    useState(false);

  const [creatingWorkItem, setCreatingWorkItem] =
    useState(false);

  const [weekStats, setWeekStats] =
    useState<DayStat[]>([]);


  // ============================================================
  // Load Work Items from AWS
  // ============================================================

  const loadItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const workItems =
        await apiListWorkItems();

      setItems(workItems);
    } catch (err) {
      console.error(
        'Failed to load Work Items:',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Work data could not be loaded. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    void loadItems();
  }, []);


  // ============================================================
  // Weekly dashboard loader
  // ============================================================

  const loadWeeklyDashboard =
    async () => {
      try {
        const weekDates =
          getCurrentWeekDates(
            new Date(),
          );

        const dashboard =
          await apiGetWeeklyDashboard(
            weekDates[0],
            weekDates[
              weekDates.length - 1
            ],
          );

        const formattedDays:
          DayStat[] =
          dashboard.days.map(
            (day) => ({
              date: day.date,

              label:
                new Date(
                  `${day.date}T00:00:00`,
                ).toLocaleDateString(
                  undefined,
                  {
                    weekday: 'short',
                  },
                ),

              workHours:
                day.workHours,

              learningHours:
                day.learningTime,

              completedTasks:
                day.completedTasks,

              learningSessions:
                day.learningSessions,
            }),
          );

        setWeekStats(
          formattedDays,
        );
      } catch (err) {
        console.error(
          'Failed to load weekly dashboard:',
          err,
        );
      }
    };


  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const weekDates =
          getCurrentWeekDates(
            new Date(),
          );

        const dashboard =
          await apiGetWeeklyDashboard(
            weekDates[0],
            weekDates[
              weekDates.length - 1
            ],
          );

        if (cancelled) {
          return;
        }

        const formattedDays:
          DayStat[] =
          dashboard.days.map(
            (day) => ({
              date: day.date,

              label:
                new Date(
                  `${day.date}T00:00:00`,
                ).toLocaleDateString(
                  undefined,
                  {
                    weekday: 'short',
                  },
                ),

              workHours:
                day.workHours,

              learningHours:
                day.learningTime,

              completedTasks:
                day.completedTasks,

              learningSessions:
                day.learningSessions,
            }),
          );

        setWeekStats(
          formattedDays,
        );
      } catch (err) {
        console.error(
          'Failed to load weekly dashboard:',
          err,
        );
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);


  // ============================================================
  // Derived state
  // ============================================================

  const today = todayIso();


  const activeItem =
    items.find(
      (item) =>
        Boolean(
          getActiveSession(item),
        ),
    ) ?? null;


  // ------------------------------------------------------------
  // Work planned specifically for today
  // ------------------------------------------------------------

  const plannedTodayItems =
    useMemo(
      () =>
        items
          .filter(
            (item) =>
              item.date === today,
          )
          .sort(
            (a, b) =>
              a.createdAt.localeCompare(
                b.createdAt,
              ),
          ),
      [items, today],
    );


  // ------------------------------------------------------------
  // Items that actually had activity today
  //
  // This includes older Work Items when they have a session
  // that started today.
  // ------------------------------------------------------------

  const todayActivityItems =
    useMemo(
      () =>
        items
          .filter(
            (item) =>
              hasActivityToday(
                item,
                today,
              ),
          )
          .sort(
            (a, b) =>
              b.updatedAt.localeCompare(
                a.updatedAt,
              ),
          ),
      [items, today],
    );


  // ------------------------------------------------------------
  // Items shown in Today's Work
  //
  // If an older Work Item is actively being worked today,
  // show it rather than displaying "No work planned yet."
  // ------------------------------------------------------------

  const todayItems =
    useMemo(() => {
      const byId =
        new Map<
          string,
          WorkItem
        >();

      for (
        const item of plannedTodayItems
      ) {
        byId.set(
          item.workId,
          item,
        );
      }

      for (
        const item of todayActivityItems
      ) {
        byId.set(
          item.workId,
          item,
        );
      }

      return Array.from(
        byId.values(),
      ).sort(
        (a, b) =>
          rank[a.status] -
            rank[b.status] ||
          b.updatedAt.localeCompare(
            a.updatedAt,
          ),
      );
    }, [
      plannedTodayItems,
      todayActivityItems,
    ]);


  // ------------------------------------------------------------
  // Resumable Work Items
  // ------------------------------------------------------------

  const resumable = useMemo(
    () =>
      items
        .filter(isResumable)
        .sort(
          (a, b) =>
            rank[a.status] -
              rank[b.status] ||
            b.updatedAt.localeCompare(
              a.updatedAt,
            ),
        ),
    [items],
  );


  const summaryItem =
    items.find(
      (item) =>
        item.id === summaryItemId,
    ) ?? null;


  // ------------------------------------------------------------
  // Completed today
  //
  // For now this is based on today's displayed activity.
  // Backend weekly statistics use completion/update date.
  // ------------------------------------------------------------

  const completedToday =
    todayActivityItems.filter(
      (item) =>
        item.status ===
        'Completed',
    ).length;


  // ------------------------------------------------------------
  // Today's active time
  //
  // IMPORTANT:
  // computeWorkItemActiveMs() includes the currently running
  // portion of an active session.
  // ------------------------------------------------------------

  const todayActiveMs =
    todayActivityItems.reduce(
      (total, item) =>
        total +
        computeWorkItemActiveMs(
          item,
          new Date(),
        ),
      0,
    );


  // ============================================================
  // Update existing Work Item
  // ============================================================

  const persist = async (
    item: WorkItem,
  ): Promise<boolean> => {
    setError(null);

    try {
      const saved =
        await apiUpdateWorkItem(
          item.workId,
          {
            status:
              item.status,

            outcome:
              item.outcome,

            notes:
              item.notes,
          },
        );

      const merged:
        WorkItem = {
        ...item,
        ...saved,

        id:
          item.id ||
          saved.id ||
          item.workId,

        sessions:
          item.sessions,
      };

      setItems(
        (previous) =>
          previous.map(
            (current) =>
              current.workId ===
              merged.workId
                ? merged
                : current,
          ),
      );

      return true;
    } catch (err) {
      console.error(
        'Failed to update Work Item:',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Your latest change could not be saved. Please retry.',
      );

      return false;
    }
  };


  // ============================================================
  // CREATE NEW WORK ITEM
  // ============================================================

  const openNewPlan = () => {
    setError(null);

    setShowChooser(false);

    setShowPlanForm(true);
  };


  const createNewWorkItem =
    async (
      draft: WorkItem,
    ) => {
      setCreatingWorkItem(
        true,
      );

      setError(null);

      try {
        const created =
          await apiCreateWorkItem(
            draft,
          );

        setItems(
          (previous) => [
            created,
            ...previous,
          ],
        );

        setShowPlanForm(
          false,
        );

        setError(null);

        await loadWeeklyDashboard();
      } catch (err) {
        console.error(
          'Failed to create Work Item:',
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : 'The Work Item could not be created. Please retry.',
        );
      } finally {
        setCreatingWorkItem(
          false,
        );
      }
    };


  // ============================================================
  // START / CONTINUE
  // ============================================================

  const startOrContinue =
    async (
      item: WorkItem,
    ) => {
      if (
        activeItem &&
        activeItem.workId !==
          item.workId
      ) {
        return;
      }

      if (
        getActiveSession(item)
      ) {
        return;
      }

      setError(null);

      try {
        const session =
          await apiStartSession(
            item.workId,
          );

        const updated:
          WorkItem = {
          ...item,

          status:
            'In Progress',

          sessions: [
            ...item.sessions,
            session,
          ],

          updatedAt:
            new Date().toISOString(),
        };

        setItems(
          (previous) =>
            previous.map(
              (current) =>
                current.workId ===
                item.workId
                  ? updated
                  : current,
            ),
        );

        setShowChooser(
          false,
        );

        await loadWeeklyDashboard();
      } catch (err) {
        console.error(
          'Failed to start Work Session:',
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : 'The work session could not be started.',
        );
      }
    };


  // ============================================================
  // Continue from Work Track
  // ============================================================

  useEffect(() => {
    const state =
      location.state as {
        continueItemId?: string;
      } | null;

    const continueItemId =
      state?.continueItemId;

    if (
      !continueItemId ||
      loading
    ) {
      return;
    }

    const item =
      items.find(
        (candidate) =>
          candidate.id ===
            continueItemId ||
          candidate.workId ===
            continueItemId,
      );

    if (
      item &&
      isResumable(item) &&
      !activeItem
    ) {
      void startOrContinue(
        item,
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    items.length,
    loading,
  ]);


  // ============================================================
  // PAUSE / RESUME / STOP
  // ============================================================

  const updateActive =
    async (
      item: WorkItem,
      action:
        | 'pause'
        | 'resume'
        | 'stop',
    ): Promise<boolean> => {
      const active =
        getActiveSession(item);

      if (!active) {
        return false;
      }

      setError(null);

      try {
        let updatedSession;

        if (
          action === 'pause'
        ) {
          updatedSession =
            await apiPauseSession(
              item.workId,
              active.sessionId,
            );
        } else if (
          action === 'resume'
        ) {
          updatedSession =
            await apiResumeSession(
              item.workId,
              active.sessionId,
            );
        } else {
          updatedSession =
            await apiStopSession(
              item.workId,
              active.sessionId,
            );
        }

        const updatedItem:
          WorkItem = {
          ...item,

          sessions:
            item.sessions.map(
              (session) =>
                session.sessionId ===
                active.sessionId
                  ? updatedSession
                  : session,
            ),

          status:
            action === 'stop'
              ? item.status
              : 'In Progress',

          updatedAt:
            new Date().toISOString(),
        };

        setItems(
          (previous) =>
            previous.map(
              (current) =>
                current.workId ===
                item.workId
                  ? updatedItem
                  : current,
            ),
        );

        // Refresh weekly statistics after every session change.
        await loadWeeklyDashboard();

        return true;
      } catch (err) {
        console.error(
          `Failed to ${action} Work Session:`,
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : `The session could not be ${action}.`,
        );

        return false;
      }
    };


  const handleStop =
    async (
      item: WorkItem,
    ) => {
      const saved =
        await updateActive(
          item,
          'stop',
        );

      if (saved) {
        setSummaryItemId(
          item.id,
        );
      }
    };


  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <LoadingSkeleton />
    );
  }


  // ============================================================
  // Dashboard
  // ============================================================

  return (
    <div>
      <header className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker">
            <span
              className="dashboard-kicker-dot"
              aria-hidden="true"
            />

            PERSONAL WORK OS
          </div>

          <h1>
            {greeting()}
            {user
              ? `, ${user.displayName}`
              : ''}
          </h1>

          <p>
            {new Date().toLocaleDateString(
              undefined,
              {
                weekday:
                  'long',
                year:
                  'numeric',
                month:
                  'long',
                day:
                  'numeric',
              },
            )}

            {todayActivityItems.length >
              0 && (
              <>
                {' · '}
                {completedToday}/
                {todayActivityItems.length}
                {' completed'}
              </>
            )}
          </p>

          <div className="dashboard-hero-subtitle">
            Your work, tracked with intent.
          </div>
        </div>


        <div className="dashboard-header-actions">
          <button
            type="button"
            onClick={() =>
              setShowChooser(true)
            }
            className="btn btn-primary dashboard-primary-action"
          >
            <span aria-hidden="true">
              +
            </span>

            Set Today's Work Plan
          </button>

          <button
            type="button"
            aria-label="Export Work Tracking"
            onClick={() =>
              setShowExport(true)
            }
            className="btn btn-secondary"
          >
            Export
          </button>
        </div>
      </header>


      {error && (
        <ErrorNotice
          message={error}
          onRetry={loadItems}
        />
      )}


      {/* ======================================================
          Active Session
      ====================================================== */}

      {activeItem && (
        <section className="dashboard-section dashboard-active-section">
          <div className="section-heading">
            <span>
              Active Session
            </span>

            <span className="section-live">
              <span
                className="section-live-dot"
                aria-hidden="true"
              />

              LIVE
            </span>
          </div>


          <div className="dashboard-active-layout">
            <div className="active-session-frame">
              <div className="active-session-frame-top">
                <span className="eyebrow">
                  CURRENT SESSION
                </span>

                <span className="active-session-id mono">
                  {activeItem.workId}
                </span>
              </div>

              <TimerCard
                item={activeItem}
                onPause={() =>
                  void updateActive(
                    activeItem,
                    'pause',
                  )
                }
                onResume={() =>
                  void updateActive(
                    activeItem,
                    'resume',
                  )
                }
                onStop={() =>
                  void handleStop(
                    activeItem,
                  )
                }
              />
            </div>


            <div className="today-glance">
              <div className="today-glance-header">
                <span className="eyebrow">
                  TODAY AT A GLANCE
                </span>

                <span className="today-glance-date mono">
                  {todayActivityItems.length
                    .toString()
                    .padStart(2, '0')}{' '}
                  ITEMS
                </span>
              </div>


              <div className="glance-metrics">
                <div className="glance-metric">
                  <span className="glance-metric-value mono">
                    {todayActivityItems.length}
                  </span>

                  <span className="glance-metric-label">
                    Work items
                  </span>
                </div>


                <div className="glance-metric">
                  <span className="glance-metric-value mono">
                    {formatCompactDuration(
                      todayActiveMs,
                    )}
                  </span>

                  <span className="glance-metric-label">
                    Active time
                  </span>
                </div>


                <div className="glance-metric">
                  <span className="glance-metric-value mono">
                    {completedToday}
                  </span>

                  <span className="glance-metric-label">
                    Completed
                  </span>
                </div>
              </div>


              <div className="glance-footer">
                <span>
                  {activeItem.taskTitle}
                </span>

                <span className="glance-footer-indicator">
                  Session in progress
                </span>
              </div>
            </div>
          </div>
        </section>
      )}


      {/* ======================================================
          Today's Work
      ====================================================== */}

      <section className="dashboard-section">
        <div className="section-heading">
          Today's Work
        </div>


        {todayItems.length === 0 ? (
          <div className="empty-state">
            <div>
              No work planned yet.
            </div>

            <button
              type="button"
              onClick={() =>
                setShowChooser(true)
              }
              className="btn btn-primary"
            >
              Set Today's Work Plan
            </button>
          </div>
        ) : (
          <div className="work-item-list">
            {todayItems.map(
              (item) => (
                <WorkItemRow
                  key={item.id}
                  item={item}

                  disabled={Boolean(
                    activeItem &&
                    activeItem.workId !==
                      item.workId,
                  )}

                  onContinue={() =>
                    void startOrContinue(
                      item,
                    )
                  }
                />
              ),
            )}
          </div>
        )}
      </section>


      {/* ======================================================
          Weekly Progress
      ====================================================== */}

      <section className="dashboard-section">
        <div className="section-heading">
          This Week
        </div>

        <div className="panel chart-panel">
          <ProgressChart
            data={weekStats}
            selectedDate={
              selectedChartDate
            }
            onSelectDay={
              setSelectedChartDate
            }
          />
        </div>
      </section>


      {/* ======================================================
          Work Plan Chooser
      ====================================================== */}

      {showChooser && (
        <WorkPlanChooser
          items={resumable}
          active={Boolean(
            activeItem,
          )}

          onClose={() =>
            setShowChooser(false)
          }

          onCreate={
            openNewPlan
          }

          onContinue={
            startOrContinue
          }
        />
      )}


      {/* ======================================================
          New Work Plan Form
      ====================================================== */}

      {showPlanForm && (
        <WorkPlanForm
          date={today}

          onCancel={() => {
            if (
              !creatingWorkItem
            ) {
              setShowPlanForm(
                false,
              );
            }
          }}

          onCreate={(item) => {
            void createNewWorkItem(
              item,
            );
          }}

          submitting={
            creatingWorkItem
          }
        />
      )}


      {/* ======================================================
          Session Summary
      ====================================================== */}

      {summaryItem && (
        <SessionSummary
          item={summaryItem}

          onSave={(updates) => {
            void persist({
              ...summaryItem,
              ...updates,
            }).then(
              (saved) =>
                saved &&
                setSummaryItemId(
                  null,
                ),
            );
          }}
        />
      )}


      {/* ======================================================
          Export
      ====================================================== */}

      {showExport && (
        <ExportModal
          defaultDate={today}
          onClose={() =>
            setShowExport(false)
          }
        />
      )}
    </div>
  );
}


// ============================================================
// Work Plan Chooser
// ============================================================

function WorkPlanChooser({
  items,
  active,
  onClose,
  onCreate,
  onContinue,
}: {
  items: WorkItem[];
  active: boolean;
  onClose: () => void;
  onCreate: () => void;
  onContinue: (
    item: WorkItem,
  ) => void;
}) {
  const [query, setQuery] =
    useState('');

  const createRef =
    useRef<HTMLButtonElement>(
      null,
    );

  const dialogRef =
    useModalAccessibility(
      onClose,
      createRef,
    );

  const matches =
    items.filter(
      (item) =>
        `${item.workId} ${item.taskTitle} ${item.project} ${item.status}`
          .toLowerCase()
          .includes(
            query.toLowerCase(),
          ),
    );

  return (
    <div className="overlay overlay-center">
      <div
        ref={dialogRef}
        className="modal modal-chooser"
        role="dialog"
        aria-modal="true"
        aria-labelledby="work-choice-title"
        tabIndex={-1}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">
              Work planning
            </p>

            <h2 id="work-choice-title">
              Set Today's Work Plan
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Close work planning"
          >
            ×
          </button>
        </div>


        <div className="chooser-routes">
          <button
            ref={createRef}
            type="button"
            onClick={onCreate}
            className="chooser-route chooser-route-primary"
          >
            <span
              className="chooser-route-icon"
              aria-hidden
            >
              +
            </span>

            <span>
              <strong>
                Create New Work Item
              </strong>

              <small>
                Plan a distinct task and
                let AWS assign a new Work
                ID.
              </small>
            </span>
          </button>

          <div className="chooser-route-label">
            Continue Previous Work
          </div>
        </div>


        <p className="chooser-help">
          Continuing creates a new
          session under the same Work ID.
        </p>


        <label
          className="sr-only"
          htmlFor="resumable-search"
        >
          Search resumable work
        </label>

        <input
          id="resumable-search"
          className="input"
          placeholder="Search Work ID, task, project, or status"
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value,
            )
          }
        />


        <div className="work-item-list chooser-results">
          {matches.length ===
          0 ? (
            <div className="empty-state empty-state-compact">
              No resumable Work Items
              found.
            </div>
          ) : (
            matches.map(
              (item) => (
                <WorkItemRow
                  key={item.id}
                  item={item}
                  compact
                  disabled={active}
                  onContinue={() =>
                    void onContinue(
                      item,
                    )
                  }
                />
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
}


// ============================================================
// Error Notice
// ============================================================

function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="error-notice"
      role="alert"
    >
      <span>
        {message}
      </span>

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() =>
          void onRetry()
        }
      >
        Retry
      </button>
    </div>
  );
}
