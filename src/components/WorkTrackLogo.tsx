type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  compact?: boolean;
  className?: string;
};

/** WorkTrack mascot closely matching the supplied brand reference. */
export default function WorkTrackLogo({ size = 42, showWordmark = true, className }: LogoProps) {
  const horizontal = showWordmark;

  return (
    <span
      className={`wt-logo ${horizontal ? 'wt-logo-horizontal' : 'wt-logo-icon-only'} ${className ?? ''}`}
      aria-label="WorkTrack"
    >
      <svg
        className="wt-logo-art"
        width={horizontal ? 150 : size}
        height={horizontal ? 100 : size}
        viewBox={horizontal ? '0 0 150 100' : '0 0 112 100'}
        role="img"
        aria-hidden="true"
      >
        {/* Clock behind the character: orange outer arc, ticks and check. */}
        <path d="M72 15 A38 38 0 0 1 109 72" className="wt-clock-arc" />
        <path d="M109 72 A38 38 0 0 1 100 82" className="wt-clock-arc wt-clock-arc-small" />
        <path d="M72 12v7 M95 18l-3 6 M108 39h-7 M108 61l-7-2" className="wt-clock-tick" />
        <path d="M78 52 L88 61 L105 40" className="wt-clock-check" />

        {/* Small chibi boy: oversized hair/head, closed happy eyes and orange hoodie. */}
        <path
          d="M12 37 C10 24 16 13 29 9 C42 5 56 10 62 21 C65 26 65 32 62 37 C57 34 54 31 51 27 C47 32 43 34 38 31 C34 36 28 38 22 34 C19 38 16 39 12 37Z"
          className="wt-hair"
        />
        <path d="M17 22 C22 12 35 7 46 12 C40 13 35 17 32 23 C27 18 22 18 17 22Z" className="wt-hair-highlight" />
        <path d="M48 12 C56 15 61 20 62 27 C57 23 53 20 48 19Z" className="wt-hair-shine" />

        <ellipse cx="35" cy="38" rx="19" ry="18" className="wt-face" />
        <path d="M18 36 C19 29 24 24 30 23 C28 30 24 35 19 37Z" className="wt-fringe" />
        <path d="M28 38 q3 4 6 0" className="wt-eye-closed" />
        <path d="M40 38 q3 4 6 0" className="wt-eye-closed" />
        <path d="M31 46 q4 5 9 0" className="wt-smile" />
        <ellipse cx="20" cy="44" rx="4" ry="2.5" className="wt-cheek" />
        <ellipse cx="50" cy="44" rx="4" ry="2.5" className="wt-cheek" />

        {/* Hoodie / body */}
        <path d="M15 58 C17 49 24 45 35 45 C47 45 56 50 59 59 L62 78 L10 78 L15 58Z" className="wt-shirt" />
        <path d="M27 49 L34 60 L41 49" className="wt-collar" />
        <path d="M20 59 C16 63 13 67 10 70" className="wt-arm" />
        <path d="M53 58 C59 61 64 65 69 69" className="wt-arm" />
        <path d="M26 63 L34 72" className="wt-sleeve-detail" />
        <path d="M44 62 L39 72" className="wt-sleeve-detail" />

        {/* Laptop in front, with the boy's hands resting on it. */}
        <rect x="39" y="56" width="53" height="29" rx="4" className="wt-laptop" />
        <rect x="44" y="61" width="43" height="19" rx="2.5" className="wt-screen" />
        <path d="M35 86 H101 L94 92 H42 Z" className="wt-base" />
        <path d="M61 86 H79" className="wt-base-line" />
        <path d="M55 68 H72" className="wt-screen-line" />
        <path d="M55 73 H67" className="wt-screen-line wt-screen-line-short" />
        <path d="M45 82 C49 78 53 77 57 80" className="wt-hand" />
        <path d="M69 80 C74 76 79 78 83 82" className="wt-hand" />
      </svg>

      {horizontal && (
        <span className="wt-logo-copy">
          <span className="wt-logo-wordmark"><span>Work</span><strong>Track</strong></span>
          <span className="wt-logo-tagline">PLAN · TRACK · LEARN · GROW</span>
        </span>
      )}
    </span>
  );
}
