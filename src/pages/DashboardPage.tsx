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
  apiListWorkItems,
  apiPauseSession,
  apiResumeSession,
  apiStartSession,
  apiStopSession,
  apiUpdateWorkItem,
} from '../lib/api';

import {
  getActiveSession,
  isResumable,
} from '../lib/timer';

import {
  computeWeekStats,
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


function todayIso(): string {
  const d = new Date();

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1,
  ).padStart(2, '0')}-${String(
    d.getDate(),
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
  // Derived state
  // ============================================================

  const today = todayIso();


  const activeItem = items.find(
    (item) =>
      getActiveSession(item),
  );


  const todayItems = useMemo(
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


  const completedToday =
    todayItems.filter(
      (item) =>
        item.status ===
        'Completed',
    ).length;


  const weekStats = useMemo(
    () =>
      computeWeekStats(
        items,
        new Date(),
      ),
    [items],
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


      const merged: WorkItem = {
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
  //
  // IMPORTANT:
  // Do NOT generate Work ID here.
  //
  // Lambda/DynamoDB generates:
  // WT-YYYYMMDD-NNN
  // atomically.
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
      setCreatingWorkItem(true);

      setError(null);

      try {
        /*
         * This calls:
         *
         * POST /work-items
         *
         * Lambda generates the real Work ID.
         */
        const created =
          await apiCreateWorkItem(
            draft,
          );


        /*
         * Add the AWS-created Work Item to the current UI.
         */
        setItems(
          (previous) => [
            created,
            ...previous,
          ],
        );


        setShowPlanForm(
          false,
        );


        /*
         * Clear any previous error.
         */
        setError(null);
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
      /*
       * Only one active session at a time in V1.
       */
      if (
        activeItem &&
        activeItem.workId !==
          item.workId
      ) {
        return;
      }


      /*
       * Don't create a second active session.
       */
      if (
        getActiveSession(item)
      ) {
        return;
      }


      setError(null);


      try {
        /*
         * POST
         * /work-items/{workId}/sessions
         */
        const session =
          await apiStartSession(
            item.workId,
          );


        const updated: WorkItem = {
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
  // Pause / Resume / Stop
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

          /*
           * Stop ends the SESSION.
           *
           * It does not automatically complete
           * the Work Item.
           */
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
      <header className="page-header dashboard-header">
        <div>
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

            {todayItems.length >
              0 && (
              <>
                {' · '}
                {completedToday}
                /
                {todayItems.length}
                {' completed today'}
              </>
            )}
          </p>
        </div>


        <div className="dashboard-header-actions">
          <button
            type="button"
            onClick={() =>
              setShowChooser(
                true,
              )
            }
            className="btn btn-primary"
          >
            Set Today's Work Plan
          </button>


          <button
            type="button"
            onClick={() =>
              setShowExport(
                true,
              )
            }
            className="btn btn-secondary"
          >
            Export Work Tracking
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
        <section className="dashboard-section dashboard-active">
          <div className="section-heading">
            Active Session
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
        </section>
      )}


      {/* ======================================================
          Today's Work
      ====================================================== */}

      <section className="dashboard-section">
        <div className="section-heading">
          Today's Work
        </div>


        {todayItems.length ===
        0 ? (
          <div className="empty-state">
            <div>
              No work planned yet.
            </div>


            <button
              type="button"
              onClick={() =>
                setShowChooser(
                  true,
                )
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
            setShowChooser(
              false,
            )
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
          /*
           * IMPORTANT:
           * There is intentionally NO generated Work ID here.
           *
           * AWS assigns the real ID when the form is submitted.
           */
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
          items={items}
          defaultDate={today}
          onClose={() =>
            setShowExport(
              false,
            )
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
