import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DayStat } from '../lib/stats';

interface Props {
  data: DayStat[];
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
}

export default function ProgressChart({ data, selectedDate, onSelectDay }: Props) {
  const totalWork = round1(data.reduce((sum, d) => sum + d.workHours, 0));
  const totalLearning = round1(data.reduce((sum, d) => sum + d.learningHours, 0));
  const selected = data.find((d) => d.date === selectedDate) ?? null;

  return (
    <div>
      <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
        <HeadlineStat dotColor="var(--brand)" label="Work progress" value={`${totalWork}h`} sublabel="this week" />
        <HeadlineStat dotColor="var(--status-running)" label="Learning progress" value={`${totalLearning}h`} sublabel="this week" />
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={data}
          barGap={3}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          onClick={(state) => {
            const label = state?.activeLabel;
            const match = data.find((d) => d.label === label);
            if (match) onSelectDay(match.date);
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'var(--text-faint)', fontSize: 11.5 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
          <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 11.5 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            cursor={{ fill: 'var(--surface-hover)' }}
            contentStyle={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-strong)',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--text)' }}
            formatter={(value, name) => [`${value}h`, name]}
          />
          <Bar dataKey="workHours" name="Work" fill="var(--brand)" radius={[3, 3, 0, 0]} cursor="pointer" maxBarSize={20} />
          <Bar dataKey="learningHours" name="Learning" fill="var(--status-running)" radius={[3, 3, 0, 0]} cursor="pointer" maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>

      {selected && <DayDetail day={selected} />}
    </div>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function HeadlineStat({ label, value, sublabel, dotColor }: { label: string; value: string; sublabel: string; dotColor: string }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor }} aria-hidden />
        {label}
      </div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>
        {value} <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 400, color: 'var(--text-faint)' }}>{sublabel}</span>
      </div>
    </div>
  );
}

function DayDetail({ day }: { day: DayStat }) {
  return (
    <div
      className="panel"
      style={{
        marginTop: 14,
        padding: '12px 14px',
        background: 'var(--surface-raised)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
      }}
    >
      <Stat label="Work hours" value={`${day.workHours}h`} />
      <Stat label="Completed tasks" value={String(day.completedTasks)} />
      <Stat label="Learning time" value={`${day.learningHours}h`} />
      <Stat label="Learning sessions" value={String(day.learningSessions)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{label}</div>
      <div className="mono" style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}
