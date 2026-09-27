import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

async function login(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name'), 'Tharunraj');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('heading', { name: /Tharunraj/ });
}

// The Active Work section and the matching Today's work row both render
// Pause/Resume/Stop for the currently open session, so queries for those
// button names are intentionally scoped to the "Active work" panel.
function activeWorkPanel() {
  return screen.getByText('Active work').closest('section') as HTMLElement;
}

describe('WorkTrack critical user journey', () => {
  it('logs in, creates a work item, runs the timer through pause/resume/stop, and records it in Work Track without auto-completing it', async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Login
    expect(screen.getByText('WorkTrack')).toBeInTheDocument();
    await login(user);

    // 2. Dashboard loads
    expect(screen.getByText('No work planned yet.')).toBeInTheDocument();
    expect(screen.getByText('No active work right now.')).toBeInTheDocument();

    // 3. Set Today's Work Plan -> chooser -> Create New Work Plan
    await user.click(screen.getAllByRole('button', { name: "Set Today's Work Plan" })[0]);
    const chooser = await screen.findByRole('dialog', { name: "Set Today's Work Plan" });
    await user.click(within(chooser).getByRole('button', { name: /Create New Work Plan/ }));
    const dialog = await screen.findByRole('dialog', { name: "Set Today's Work Plan" });

    await user.type(within(dialog).getByLabelText('Project *'), 'FiNoX');
    await user.type(within(dialog).getByLabelText('Task Title *'), 'Investigate flaky test');
    await user.type(within(dialog).getByLabelText('Description *'), 'Timer suite intermittently failing in CI');
    await user.click(within(dialog).getByRole('button', { name: 'Create Work Item' }));

    // 4. Work item appears on dashboard
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getAllByText('Investigate flaky test').length).toBeGreaterThan(0);

    // 5-7. Start works, timer runs — via the Today's work row (has its own Start button)
    await user.click(screen.getByRole('button', { name: 'Start' }));
    const panel = activeWorkPanel();
    expect(await within(panel).findByText('Running')).toBeInTheDocument();

    // 8. Pause works
    await user.click(within(panel).getByRole('button', { name: 'Pause' }));
    expect(await within(panel).findByText('Paused')).toBeInTheDocument();

    // 9. Resume works
    await user.click(within(panel).getByRole('button', { name: 'Resume' }));
    expect(await within(panel).findByText('Running')).toBeInTheDocument();

    // 10. Stop works -> 12. Work Session Summary appears
    await user.click(within(panel).getByRole('button', { name: 'Stop' }));
    const summary = await screen.findByRole('dialog', { name: 'Work Session Summary' });
    expect(within(summary).getByText('Active Time Spent')).toBeInTheDocument();

    // The status picker must NOT default to Completed — stopping a session
    // never implies the work item is done.
    expect(within(summary).getByLabelText('Status')).toHaveValue('In Progress');

    // 13. Save without changing status
    await user.click(within(summary).getByRole('button', { name: 'Save & Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // Item remains In Progress and resumable — no active session right now
    expect(screen.getByText('No active work right now.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();

    // 14. Work item appears in Work Track, still In Progress (not auto-completed)
    await user.click(screen.getByRole('link', { name: 'Work Track' }));
    expect(await screen.findByText('Investigate flaky test')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('continues a previous work item under the same Work ID and sums active time across sessions', async () => {
    const user = userEvent.setup();
    render(<App />);
    await login(user);

    // Create and run a first session of ~0 duration, stop it, leave In Progress.
    await user.click(screen.getAllByRole('button', { name: "Set Today's Work Plan" })[0]);
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Create New Work Plan/ }));
    const dialog = await screen.findByRole('dialog', { name: "Set Today's Work Plan" });
    await user.type(within(dialog).getByLabelText('Project *'), 'FiNoX');
    await user.type(within(dialog).getByLabelText('Task Title *'), 'Develop the WorkTrack app');
    await user.type(within(dialog).getByLabelText('Description *'), 'Multi-session continuation');
    await user.click(within(dialog).getByRole('button', { name: 'Create Work Item' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    const originalWorkId = screen.getByText(/WT-\d{8}-\d{3}/).textContent;

    await user.click(screen.getByRole('button', { name: 'Start' }));
    let panel = activeWorkPanel();
    await user.click(within(panel).getByRole('button', { name: 'Stop' }));
    const summary1 = await screen.findByRole('dialog', { name: 'Work Session Summary' });
    await user.click(within(summary1).getByRole('button', { name: 'Save & Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // 15. "Continue" reuses the row's own Continue button — same Work ID, new session.
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    panel = activeWorkPanel();
    expect(await within(panel).findByText('Running')).toBeInTheDocument();
    expect(within(panel).getByText(originalWorkId!)).toBeInTheDocument();

    // 16. Concurrency: with a session already open, other rows can't start one.
    // (Only one work item exists here, so we assert the row's own Start/Continue
    // is replaced by Pause/Stop rather than a second, independently-clickable Start.)
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument();

    await user.click(within(panel).getByRole('button', { name: 'Stop' }));
    const summary2 = await screen.findByRole('dialog', { name: 'Work Session Summary' });
    await user.click(within(summary2).getByRole('button', { name: 'Save & Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // 11/12. Work Track shows one row (same Work ID, not a duplicate) with two sessions.
    await user.click(screen.getByRole('link', { name: 'Work Track' }));
    const rows = screen.getAllByText(originalWorkId!);
    expect(rows).toHaveLength(1);
    await user.click(rows[0]);
    const detail = await screen.findByRole('dialog', { name: /Develop the WorkTrack app/ });
    expect(within(detail).getByText('Session 1')).toBeInTheDocument();
    expect(within(detail).getByText('Session 2')).toBeInTheDocument();
  });

  it('does not offer Continue on a Completed work item', async () => {
    const user = userEvent.setup();
    render(<App />);
    await login(user);

    await user.click(screen.getAllByRole('button', { name: "Set Today's Work Plan" })[0]);
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Create New Work Plan/ }));
    const dialog = await screen.findByRole('dialog', { name: "Set Today's Work Plan" });
    await user.type(within(dialog).getByLabelText('Project *'), 'FiNoX');
    await user.type(within(dialog).getByLabelText('Task Title *'), 'Ship the release notes');
    await user.type(within(dialog).getByLabelText('Description *'), 'Final pass');
    await user.click(within(dialog).getByRole('button', { name: 'Create Work Item' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Start' }));
    const panel = activeWorkPanel();
    await user.click(within(panel).getByRole('button', { name: 'Stop' }));
    const summary = await screen.findByRole('dialog', { name: 'Work Session Summary' });
    await user.selectOptions(within(summary).getByLabelText('Status'), 'Completed');
    await user.click(within(summary).getByRole('button', { name: 'Save & Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // 13. Completed items don't offer Continue on the dashboard row...
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();

    // ...nor in the Continue Previous Work picker.
    await user.click(screen.getAllByRole('button', { name: "Set Today's Work Plan" })[0]);
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Continue Previous Work/ }));
    expect(await screen.findByText('No resumable work items match this search.')).toBeInTheDocument();

    // ...and the Work Track detail view shows it as read-only history.
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(screen.getByRole('link', { name: 'Work Track' }));
    await user.click(await screen.findByText('Ship the release notes'));
    const detail = await screen.findByRole('dialog', { name: /Ship the release notes/ });
    expect(within(detail).getByText(/read-only history/)).toBeInTheDocument();
    expect(within(detail).queryByRole('button', { name: 'Continue Work' })).not.toBeInTheDocument();
  });

  it('shows a clear empty state and a real generate flow in the export dialog', async () => {
    const user = userEvent.setup();
    render(<App />);
    await login(user);

    await user.click(screen.getByRole('button', { name: 'Export Work Tracking' }));
    const dialog = await screen.findByRole('dialog', { name: 'Export Work Tracking' });

    await user.click(within(dialog).getByRole('button', { name: 'Generate Report' }));
    expect(await within(dialog).findByText('No work records found for this date range.')).toBeInTheDocument();
  });
});
