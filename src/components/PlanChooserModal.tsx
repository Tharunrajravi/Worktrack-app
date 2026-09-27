interface Props {
  onCreateNew: () => void;
  onContinuePrevious: () => void;
  onClose: () => void;
}

export default function PlanChooserModal({ onCreateNew, onContinuePrevious, onClose }: Props) {
  return (
    <div className="overlay overlay-center" role="dialog" aria-modal="true" aria-labelledby="plan-chooser-title">
      <div className="modal" style={{ width: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 id="plan-chooser-title" style={{ fontSize: 18 }}>
            Set Today's Work Plan
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close">
            Close
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 20px' }}>What would you like to do?</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ChoiceButton icon="+" title="Create New Work Plan" subtitle="Start a brand-new work item" onClick={onCreateNew} />
          <ChoiceButton
            icon="↻"
            title="Continue Previous Work"
            subtitle="Resume an existing in-progress or blocked item"
            onClick={onContinuePrevious}
          />
        </div>
      </div>
    </div>
  );
}

function ChoiceButton({ icon, title, subtitle, onClick }: { icon: string; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="btn"
      style={{
        justifyContent: 'flex-start',
        textAlign: 'left',
        padding: '14px 16px',
        border: '1px solid var(--border-strong)',
        background: 'transparent',
        color: 'var(--text)',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          background: 'var(--brand-bg)',
          color: 'var(--brand-strong)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>{subtitle}</div>
      </span>
    </button>
  );
}
