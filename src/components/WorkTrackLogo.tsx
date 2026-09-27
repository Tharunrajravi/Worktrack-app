type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  compact?: boolean;
  className?: string;
};

/** WorkTrack mascot based directly on the supplied reference composition. */
export default function WorkTrackLogo({ size = 52, showWordmark = true, className }: LogoProps) {
  const horizontal = showWordmark;

  return (
    <span
      className={`wt-logo ${horizontal ? 'wt-logo-horizontal' : 'wt-logo-icon-only'} ${className ?? ''}`}
      aria-label="WorkTrack"
    >
      <svg
        className="wt-logo-art"
        width={horizontal ? 180 : size}
        height={horizontal ? 118 : size}
        viewBox="0 0 170 118"
        role="img"
        aria-hidden="true"
      >
        {/* little sparkle from the reference */}
        <path d="M12 55 l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" className="wt-spark" />

        {/* large orange clock arc */}
        <path d="M91 15 C119 12 142 31 145 59 C147 76 141 91 130 101" className="wt-clock-arc" />
        <path d="M89 15 L84 15" className="wt-clock-arc wt-clock-cap" />
        <path d="M128 96 L133 101" className="wt-clock-arc wt-clock-cap" />

        {/* clock ticks */}
        <path d="M104 18v9 M127 29l-5 8 M139 51h-9 M137 73l-9-3" className="wt-clock-tick" />
        {/* clock check */}
        <path d="M104 57 L115 68 L134 45" className="wt-clock-check" />

        {/* hair silhouette — deliberately fuller and spikier like the supplied mascot */}
        <path d="M31 49 C22 45 19 37 21 28 C23 19 29 13 38 10 C43 4 53 2 61 6 C69 3 78 7 83 13 C92 16 96 23 95 31 C94 38 90 45 83 49 C77 45 73 40 69 35 C64 41 57 43 50 39 C45 45 38 49 31 49Z" className="wt-hair" />
        <path d="M27 31 C29 20 39 12 50 11 C44 17 40 23 39 31 C35 26 31 27 27 31Z" className="wt-hair-highlight" />
        <path d="M47 9 C58 6 70 9 77 16 C67 14 59 18 53 25 C50 19 49 14 47 9Z" className="wt-hair-shine" />
        <path d="M73 12 C84 16 90 22 91 31 C86 26 81 23 75 22Z" className="wt-hair-highlight" />
        <path d="M35 38 C38 31 43 25 49 23 C47 31 44 36 38 41Z" className="wt-fringe" />
        <path d="M56 35 C60 29 64 26 70 25 C67 33 63 38 57 40Z" className="wt-fringe" />

        {/* face */}
        <ellipse cx="57" cy="48" rx="27" ry="25" className="wt-face" />
        <path d="M44 49 q4 6 9 0 M61 49 q4 6 9 0" className="wt-eye-closed" />
        <path d="M51 59 q6 7 12 0" className="wt-smile" />
        <ellipse cx="36" cy="57" rx="6" ry="3" className="wt-cheek" />
        <ellipse cx="78" cy="57" rx="6" ry="3" className="wt-cheek" />

        {/* orange hoodie/body */}
        <path d="M30 75 C33 65 42 62 57 62 C72 62 82 68 87 78 L91 103 H25 Z" className="wt-shirt" />
        <path d="M45 66 L57 80 L69 66" className="wt-collar" />
        <path d="M35 76 C29 82 25 87 20 92" className="wt-arm" />
        <path d="M78 75 C85 78 90 83 96 88" className="wt-arm" />
        <path d="M37 80 L47 93 M74 79 L66 93" className="wt-sleeve-detail" />

        {/* laptop */}
        <rect x="54" y="76" width="78" height="42" rx="5" className="wt-laptop" />
        <rect x="60" y="82" width="66" height="29" rx="3" className="wt-screen" />
        <path d="M49 116 H142 L133 124 H58 Z" className="wt-base" />
        <path d="M82 116 H105" className="wt-base-line" />
        <path d="M74 91 H99 M74 98 H92" className="wt-screen-line" />

        {/* hands resting on the laptop */}
        <path d="M61 110 C66 104 72 103 78 108" className="wt-hand" />
        <path d="M96 108 C102 103 109 104 115 110" className="wt-hand" />
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
