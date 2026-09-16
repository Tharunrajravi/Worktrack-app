import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DayStat } from '../lib/stats';

interface Props {
  data: DayStat[];
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
}

export default function ProgressChart({
  data,
  selectedDate,
  onSelectDay,
}: Props) {
  const totalWork = round1(
    data.reduce((sum, day) => sum + day.workHours, 0),
  );

  const totalLearning = round1(
    data.reduce((sum, day) => sum + day.learningHours, 0),
  );

  const totalCompleted = data.reduce(
    (sum, day) => sum + day.completedTasks,
    0,
  );

  const totalSessions = data.reduce(
    (sum, day) => sum + day.learningSessions,
    0,
  );

  const selected =
    data.find((day) => day.date === selectedDate) ?? null;

  const handleChartClick = (state: {
    activeLabel?: string | number;
  }) => {
    const label = state?.activeLabel;

    if (label === undefined) {
      return;
    }

    const match = data.find(
      (day) => day.label === String(label),
    );

    if (match) {
      onSelectDay(match.date);
    }
  };

  return (
    <div className="progress-chart">
      {/* Weekly overview */}
      <div className="progress-overview">
        <div className="progress-overview-copy">
          <span className="eyebrow">WEEKLY ACTIVITY</span>

          <h3 className="progress-title">
            Work &amp; learning rhythm
          </h3>

          <p className="progress-description">
            A compact view of how your week is moving.
            Select a day to inspect the details.
          </p>
        </div>

        <div className="progress-summary">
          <HeadlineStat
            accent="brand"
            label="Work"
            value={`${totalWork}h`}
          />

          <HeadlineStat
            accent="learning"
            label="Learning"
            value={`${totalLearning}h`}
          />

          <HeadlineStat
            accent="neutral"
            label="Completed"
            value={String(totalCompleted)}
          />
        </div>
      </div>

      {/* Chart */}
      <div className="progress-chart-frame">
        <div className="progress-chart-legend">
          <span className="progress-legend-item">
            <span
              className="progress-legend-dot progress-legend-work"
              aria-hidden="true"
            />
            Work
          </span>

          <span className="progress-legend-item">
            <span
              className="progress-legend-dot progress-legend-learning"
              aria-hidden="true"
            />
            Learning
          </span>

          <span className="progress-chart-hint">
            Select a day
          </span>
        </div>

        <ResponsiveContainer
          width="100%"
          height={220}
        >
          <BarChart
            data={data}
            barGap={5}
            barCategoryGap="28%"
            margin={{
              top: 10,
              right: 8,
              left: -20,
              bottom: 4,
            }}
            onClick={handleChartClick}
          >
            <CartesianGrid
              strokeDasharray="2 5"
              stroke="var(--border)"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              tick={{
                fill: 'var(--text-muted)',
                fontSize: 11,
              }}
              axisLine={{
                stroke: 'var(--border)',
              }}
              tickLine={false}
              tickMargin={10}
            />

            <YAxis
              tick={{
                fill: 'var(--text-faint)',
                fontSize: 10,
              }}
              axisLine={false}
              tickLine={false}
              width={30}
              tickFormatter={(value) => `${value}h`}
            />

            <Tooltip
              cursor={{
                fill: 'var(--surface-hover)',
              }}
              contentStyle={{
                background:
                  'var(--surface-raised)',
                border:
                  '1px solid var(--border-strong)',
                borderRadius: 10,
                boxShadow:
                  'var(--shadow-md)',
                fontSize: 12,
                padding: '10px 12px',
              }}
              labelStyle={{
                color: 'var(--text)',
                fontWeight: 600,
                marginBottom: 5,
              }}
              itemStyle={{
                color: 'var(--text-muted)',
              }}
              formatter={(
                value,
                name,
              ) => [
                `${Number(value).toFixed(1)}h`,
                name,
              ]}
            />

            <Bar
              dataKey="workHours"
              name="Work"
              fill="var(--brand)"
              radius={[4, 4, 1, 1]}
              cursor="pointer"
              maxBarSize={18}
              opacity={0.95}
            />

            <Bar
              dataKey="learningHours"
              name="Learning"
              fill="var(--status-running)"
              radius={[4, 4, 1, 1]}
              cursor="pointer"
              maxBarSize={18}
              opacity={0.9}
            />
          </BarChart>
        </ResponsiveContainer>

        {data.length === 0 && (
          <div className="progress-chart-empty">
            <span className="eyebrow">
              NO ACTIVITY
            </span>

            <span>
              Your weekly activity will appear here
              once you start tracking work.
            </span>
          </div>
        )}
      </div>

      {/* Selected day */}
      {selected ? (
        <DayDetail day={selected} />
      ) : (
        <div className="progress-selection-hint">
          <span className="progress-selection-line" />
          <span>
            Select a day to see its breakdown
          </span>
          <span className="progress-selection-line" />
        </div>
      )}

      {/* Small weekly footer */}
      <div className="progress-footer">
        <span>
          {totalSessions} learning session
          {totalSessions === 1 ? '' : 's'}
        </span>

        <span className="progress-footer-separator">
          /
        </span>

        <span>
          {totalCompleted} completed task
          {totalCompleted === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
}

function HeadlineStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'brand' | 'learning' | 'neutral';
}) {
  return (
    <div className="progress-headline-stat">
      <div className="progress-headline-label">
        <span
          className={`progress-stat-dot progress-stat-dot-${accent}`}
          aria-hidden="true"
        />

        <span>{label}</span>
      </div>

      <div className="progress-headline-value mono">
        {value}
      </div>
    </div>
  );
}

function DayDetail({
  day,
}: {
  day: DayStat;
}) {
  const formattedDate = new Date(
    `${day.date}T00:00:00`,
  ).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="progress-day-detail">
      <div className="progress-day-detail-header">
        <div>
          <span className="eyebrow">
            SELECTED DAY
          </span>

          <h4>{formattedDate}</h4>
        </div>

        <span className="progress-day-date mono">
          {day.date}
        </span>
      </div>

      <div className="progress-day-metrics">
        <DayMetric
          label="Work hours"
          value={`${round1(day.workHours)}h`}
          accent="brand"
        />

        <DayMetric
          label="Completed tasks"
          value={String(day.completedTasks)}
          accent="neutral"
        />

        <DayMetric
          label="Learning time"
          value={`${round1(day.learningHours)}h`}
          accent="learning"
        />

        <DayMetric
          label="Learning sessions"
          value={String(day.learningSessions)}
          accent="neutral"
        />
      </div>
    </div>
  );
}

function DayMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'brand' | 'learning' | 'neutral';
}) {
  return (
    <div className="progress-day-metric">
      <div className="progress-day-metric-top">
        <span
          className={`progress-metric-marker progress-metric-marker-${accent}`}
          aria-hidden="true"
        />

        <span>{label}</span>
      </div>

      <div className="progress-day-metric-value mono">
        {value}
      </div>
    </div>
  );
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
