type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  compact?: boolean;
  className?: string;
};

/** WorkTrack mascot recreated from the supplied brand-reference composition. */
export default function WorkTrackLogo({ size = 44, showWordmark = true, className }: LogoProps) {
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
        viewBox={horizontal ? '0 0 150 100' : '0 0 100 100'}
        role="img"
        aria-hidden="true"
      >
        {/* orange clock/check behind the mascot */}
        <path d="M72 12 A36 36 0 0 1 108 70" className="wt-clock-arc" />
        <path d="M109 70 A36 36 0 0 1 102 79" className="wt-clock-arc wt-clock-arc-small" />
        <path d="M72 10v7 M96 16l-3 7 M109 38h-7 M109 60l-7-2" className="wt-clock-tick" />
        <path d="M78 51 L88 60 L105 39" className="wt-clock-check" />

        {/* chibi hair silhouette */}
        <path d="M10 39 C8 31 11 22 18 17 C20 10 28 6 36 8 C43 5 52 8 57 14 C63 16 67 23 66 30 C66 35 63 40 59 43 C55 38 52 35 48 31 C45 36 39 38 34 34 C29 39 23 40 18 36 C16 40 13 41 10 39Z" className="wt-hair" />
        <path d="M16 22 C22 12 33 8 43 12 C37 13 31 18 28 25 C24 20 20 20 16 22Z" className="wt-hair-highlight" />
        <path d="M44 11 C53 13 59 18 62 25 C57 21 53 19 48 18Z" className="wt-hair-shine" />
        <path d="M16 27 C19 21 23 18 28 17 C26 24 22 30 17 32Z" className="wt-fringe" />

        {/* face */}
        <ellipse cx="36" cy="39" rx="19" ry="18" className="wt-face" />
        <path d="M27 38 q3 4 6 0 M40 38 q3 4 6 0" className="wt-eye-closed" />
        <path d="M31 46 q4 5 9 0" className="wt-smile" />
        <ellipse cx="21" cy="44" rx="4" ry="2.5" className="wt-cheek" />
        <ellipse cx="51" cy="44" rx="4" ry="2.5" className="wt-cheek" />

        {/* orange hoodie/body */}
        <path d="M16 59 C18 50 25 46 36 46 C47 46 55 51 59 59 L61 78 H11 Z" className="wt-shirt" />
        <path d="M27 49 L36 60 L44 49" className="wt-collar" />
        <path d="M19 58 C15 62 12 66 9 69 M53 58 C59 61 63 64 67 68" className="wt-arm" />
        <path d="M26 63 L34 72 M45 62 L40 72" className="wt-sleeve-detail" />

        {/* laptop in front */}
        <rect x="39" y="56" width="53" height="29" rx="4" className="wt-laptop" />
        <rect x="44" y="61" width="43" height="19" rx="2.5" className="wt-screen" />
        <path d="M35 86 H101 L94 92 H42 Z" className="wt-base" />
        <path d="M61 86 H79" className="wt-base-line" />
        <path d="M55 68 H72 M55 73 H67" className="wt-screen-line" />
        <path d="M45 82 C49 78 53 77 57 80 M69 80 C74 76 79 78 83 82" className="wt-hand" />
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
