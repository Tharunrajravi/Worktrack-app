type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  compact?: boolean;
  className?: string;
};

export default function WorkTrackLogo({ size = 42, showWordmark = true, compact = false, className }: LogoProps) {
  const iconSize = compact ? size : size;

  return (
    <span className={`wt-logo ${className ?? ''}`} style={{ '--wt-logo-size': `${iconSize}px` } as React.CSSProperties}>
      <svg
        className="wt-logo-mark"
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        role="img"
        aria-label="WorkTrack mascot logo"
      >
        <circle cx="44" cy="27" r="15" className="wt-logo-clock" />
        <path d="M44 14v4M44 36v4M31 27h4M53 27h4" className="wt-logo-clock-tick" />
        <path d="M44 27l6-5M44 27l-5 5" className="wt-logo-clock-hand" />
        <path d="M17 20c0-7 5-11 12-11 5 0 9 2 11 6-3 1-6 3-8 6-4-2-10-2-15-1Z" className="wt-logo-hair" />
        <circle cx="25" cy="28" r="10" className="wt-logo-face" />
        <circle cx="21.5" cy="27.5" r="1.7" className="wt-logo-eye" />
        <circle cx="28.5" cy="27.5" r="1.7" className="wt-logo-eye" />
        <path d="M23 32c1.5 1.6 3.5 1.6 5 0" className="wt-logo-smile" />
        <path d="M14 42c0-7 5-11 12-11s12 4 12 11v7H14v-7Z" className="wt-logo-shirt" />
        <path d="M29 37l8 5" className="wt-logo-arm" />
        <rect x="31" y="39" width="17" height="11" rx="2" className="wt-logo-laptop" />
        <path d="M28 51h23" className="wt-logo-laptop-base" />
        <path d="M36 42h8v5h-8z" className="wt-logo-screen" />
        <path d="M19 42l-5 6" className="wt-logo-arm" />
      </svg>
      {showWordmark && (
        <span className="wt-logo-wordmark">
          <span>Work</span><strong>Track</strong>
        </span>
      )}
    </span>
  );
}
