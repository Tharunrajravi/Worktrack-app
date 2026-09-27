type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  compact?: boolean;
  className?: string;
};

/**
 * WorkTrack brand mark.
 * The mascot artwork is the supplied reference asset. The horizontal lockup
 * reuses that exact mascot and pairs it with the WorkTrack wordmark/tagline.
 */
export default function WorkTrackLogo({ size = 52, showWordmark = true, className }: LogoProps) {
  return (
    <span
      className={`wt-logo ${showWordmark ? 'wt-logo-horizontal' : 'wt-logo-icon-only'} ${className ?? ''}`}
      aria-label="WorkTrack"
    >
      <img
        className="wt-logo-art"
        src="/assets/worktrack-icon.png"
        alt=""
        width={showWordmark ? 132 : size}
        height={showWordmark ? 122 : size}
      />

      {showWordmark && (
        <span className="wt-logo-copy">
          <span className="wt-logo-wordmark">
            <span>Work</span><strong>Track</strong>
          </span>
          <span className="wt-logo-tagline">PLAN · TRACK · LEARN · GROW</span>
        </span>
      )}
    </span>
  );
}
