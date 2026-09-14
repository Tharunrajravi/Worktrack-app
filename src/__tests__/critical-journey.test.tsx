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

describe('WorkTrack critical user journey', () => {
  it('logs in, creates a work item, runs the timer through pause/resume/stop, and records it in Work Track', async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Login
    expect(screen.getByText('WorkTrack')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Name'), 'Tharunraj');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // 2. Dashboard loads
    expect(await screen.findByRole('heading', { name: /Tharunraj/ })).toBeInTheDocument();
    expect(screen.getByText('No work planned yet.')).toBeInTheDocument();

    // 3. Set Today's Work Plan (two buttons render it — header action and empty state)
    await user.click(screen.getAllByRole('button', { name: "Set Today's Work Plan" })[0]);
    const chooser = await screen.findByRole('dialog', { name: "Set Today's Work Plan" });
    await user.click(within(chooser).getByRole('button', { name: /Create New Work Item/ }));
    const dialog = await screen.findByRole('dialog', { name: "Set Today's Work Plan" });

    await user.type(within(dialog).getByLabelText('Project *'), 'FiNoX');
    await user.type(within(dialog).getByLabelText('Task Title *'), 'Investigate flaky test');
    await user.type(within(dialog).getByLabelText('Description *'), 'Timer suite intermittently failing in CI');
    await user.click(within(dialog).getByRole('button', { name: 'Create Work Item' }));

    // 4. Work item appears on dashboard
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('Investigate flaky test')).toBeInTheDocument();

    // 5-7. Start works, timer runs
    await user.click(
      screen.getByRole('button', {
        name: /Continue .* under Work ID/,
      }),
    );
    expect(await screen.findByText('Running')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

    // 8. Pause works
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(await screen.findByText('Paused')).toBeInTheDocument();

    // 9. Resume works
    await user.click(screen.getByRole('button', { name: 'Resume' }));
    expect(await screen.findByText('Running')).toBeInTheDocument();

    // 10. Stop works -> 12. Work Session Summary appears
    await user.click(screen.getByRole('button', { name: 'Stop Session' }));
    const summary = await screen.findByRole('dialog', { name: 'Session recorded' });
    expect(within(summary).getByText('This session')).toBeInTheDocument();
    expect(within(summary).getByText('Work Item total')).toBeInTheDocument();

    // 13. Status can be updated, then saved
    await user.selectOptions(within(summary).getByLabelText('Work Item status'), 'Completed');
    await user.click(within(summary).getByRole('button', { name: 'Save & Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // 14. Work item appears in Work Track
    await user.click(screen.getByRole('link', { name: 'Work Track' }));
    expect((await screen.findAllByText('Investigate flaky test')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Completed')).length).toBeGreaterThan(0);
  });

  it('shows a clear empty state and a real generate flow in the export dialog', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Name'), 'Tharunraj');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await user.click(await screen.findByRole('button', { name: 'Export Work Tracking' }));
    const dialog = await screen.findByRole('dialog', { name: 'Export Work Tracking' });

    await user.click(within(dialog).getByRole('button', { name: 'Generate Report' }));
    expect(await within(dialog).findByText('No work records found for this date range.')).toBeInTheDocument();
  });
  it('excludes completed items from continuation and resumes a Work Track row as a second session', async () => {
    localStorage.setItem('worktrack_items_v1', JSON.stringify([
      { id: 'resume-item', workId: 'WT-20260913-001', date: '2026-09-13', project: 'FiNoX', taskTitle: 'Continue me', description: 'Existing work', priority: 'Medium', technologies: [], links: [], status: 'In Progress', sessions: [{ sessionId: 'session-1', workItemId: 'resume-item', startedAt: '2026-09-13T10:00:00Z', endedAt: '2026-09-13T10:30:00Z', intervals: [{ start: '2026-09-13T10:00:00Z', end: '2026-09-13T10:30:00Z' }], activeDuration: 1800000, createdAt: '2026-09-13T10:00:00Z', updatedAt: '2026-09-13T10:30:00Z' }], createdAt: '2026-09-13T10:00:00Z', updatedAt: '2026-09-13T10:30:00Z' },
      { id: 'completed-item', workId: 'WT-20260913-002', date: '2026-09-13', project: 'FiNoX', taskTitle: 'Do not continue', description: 'Done', priority: 'Medium', technologies: [], links: [], status: 'Completed', sessions: [], createdAt: '2026-09-13T10:00:00Z', updatedAt: '2026-09-13T10:00:00Z' }
    ]));
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Name'), 'Tharunraj');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click((await screen.findAllByRole('button', { name: "Set Today's Work Plan" }))[0]);
    const chooser = await screen.findByRole('dialog', { name: "Set Today's Work Plan" });
    expect(within(chooser).getByText('Continue me')).toBeInTheDocument();
    expect(within(chooser).queryByText('Do not continue')).not.toBeInTheDocument();
    await user.click(within(chooser).getByRole('button', { name: /Continue Continue me/ }));
    expect(await screen.findByText('Session 2', { exact: false })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Stop Session' }));
    await user.click(within(await screen.findByRole('dialog', { name: 'Session recorded' })).getByRole('button', { name: 'Save & Close' }));
    await user.click(screen.getByRole('link', { name: 'Work Track' }));
    await user.click((await screen.findAllByRole('button', { name: /Continue Continue me/ }))[0]);
    expect(await screen.findByText('Session 3', { exact: false })).toBeInTheDocument();
  });

});
