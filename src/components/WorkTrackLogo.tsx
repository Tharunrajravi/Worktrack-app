type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  compact?: boolean;
  className?: string;
};

/** WorkTrack mascot based on the supplied brand reference. */
export default function WorkTrackLogo({ size = 42, showWordmark = true, className }: LogoProps) {
  return (
    <span
      className={`wt-logo ${showWordmark ? 'wt-logo-horizontal' : 'wt-logo-icon-only'} ${className ?? ''}`}
      aria-label="WorkTrack"
    >
      <svg
        className="wt-logo-art"
        width={showWordmark ? 126 : size}
        height={showWordmark ? 92 : size}
        viewBox={showWordmark ? '0 0 126 92' : '0 0 110 92'}
        role="img"
        aria-hidden="true"
      >
        <path d="M69 13 A35 35 0 0 1 108 61" className="wt-clock-arc" />
        <path d="M108 61 A35 35 0 0 1 98 72" className="wt-clock-arc wt-clock-arc-small" />
        <path d="M76 25 L76 31 M96 25 L93 30 M105 42 L99 42 M104 58 L98 55" className="wt-clock-tick" />
        <path d="M82 43 L92 51 L105 35" className="wt-clock-check" />

        <path d="M16 31 C17 17 28 10 43 12 C54 13 62 20 64 30 C58 27 54 25 49 25 C45 30 40 31 35 28 C31 34 23 35 16 31Z" className="wt-hair" />
        <path d="M22 20 C27 13 38 9 48 14 C43 15 39 18 36 23 C31 19 26 19 22 20Z" className="wt-hair-highlight" />
        <ellipse cx="38" cy="36" rx="16" ry="15" className="wt-face" />
        <path d="M24 33 C25 27 29 24 34 23 C32 29 28 34 24 33Z" className="wt-fringe" />
        <circle cx="32" cy="37" r="2.1" className="wt-eye" />
        <circle cx="44" cy="37" r="2.1" className="wt-eye" />
        <path d="M34 44 C37 47 41 47 44 43" className="wt-smile" />
        <circle cx="27" cy="42" r="2.4" className="wt-cheek" />
        <circle cx="49" cy="42" r="2.4" className="wt-cheek" />

        <path d="M17 58 C18 49 26 46 38 46 C50 46 57 50 60 59 L61 72 L14 72 L17 58Z" className="wt-shirt" />
        <path d="M29 49 L34 58 L39 50" className="wt-collar" />
        <path d="M18 59 L9 69" className="wt-arm" />
        <path d="M55 56 L67 64" className="wt-arm" />

        <rect x="45" y="54" width="45" height="25" rx="3.5" className="wt-laptop" />
        <rect x="49" y="58" width="37" height="17" rx="2" className="wt-screen" />
        <path d="M39 80 H96 L91 85 H45 Z" className="wt-base" />
        <path d="M63 80 H78" className="wt-base-line" />
        <path d="M61 65 H74" className="wt-screen-line" />
        <path d="M61 69 H70" className="wt-screen-line wt-screen-line-short" />
      </svg>

      {showWordmark && (
        <span className="wt-logo-copy">
          <span className="wt-logo-wordmark"><span>Work</span><strong>Track</strong></span>
          <span className="wt-logo-tagline">PLAN · TRACK · LEARN · GROW</span>
        </span>
      )}
    </span>
  );
}
