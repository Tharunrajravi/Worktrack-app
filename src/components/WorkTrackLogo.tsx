type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  compact?: boolean;
  className?: string;
};

/**
 * Crisp vector WorkTrack logo.
 *
 * The mark follows the supplied reference: a cute boy in front of a laptop,
 * a large clock behind him with the orange progress arc, and the WorkTrack
 * wordmark/tagline for the horizontal lockup. Everything is rendered as SVG
 * so it stays sharp at both login and dashboard sizes.
 */
export default function WorkTrackLogo({ size = 52, showWordmark = true, className }: LogoProps) {
  if (!showWordmark) {
    return (
      <span className={`wt-logo wt-logo-icon-only ${className ?? ''}`} aria-label="WorkTrack">
        <svg className="wt-logo-svg" viewBox="0 0 220 220" role="img" aria-hidden="true" width={size} height={size}>
          <defs>
            <linearGradient id="wtClock" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#eef2f7" />
            </linearGradient>
          </defs>
          <circle cx="139" cy="91" r="67" fill="url(#wtClock)" />
          <path d="M93 44 A67 67 0 0 1 178 143" fill="none" stroke="#f59e22" strokeWidth="13" strokeLinecap="round" />
          <g stroke="#172033" strokeWidth="6" strokeLinecap="round">
            <path d="M139 42v11" />
            <path d="M188 91h-11" />
            <path d="M139 140v-11" />
            <path d="M90 91h11" />
          </g>
          <path d="M139 91l-19 21 31-35" fill="none" stroke="#172033" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="139" cy="91" r="5" fill="#172033" />

          <g>
            <path d="M59 113c-2-28 13-52 39-59 17-5 34 2 45 15l-7 59H68z" fill="#2a1720" />
            <path d="M58 111c1-16 8-29 20-39 8-7 18-11 30-12-4 8-10 14-18 19 13-5 25-5 37-2-7 7-15 12-25 15 11 0 20 3 29 8-12 10-28 14-48 11z" fill="#3a2029" />
            <path d="M79 103c0-19 13-31 31-31 19 0 32 13 32 32v21c0 21-14 34-32 34-18 0-31-13-31-34z" fill="#ffc3a6" />
            <path d="M81 101c5-24 17-34 35-34 16 0 27 8 32 23-11-6-22-8-34-5-10 2-19 8-27 16z" fill="#2b1820" />
            <path d="M101 110c3 3 7 3 10 0" fill="none" stroke="#512c31" strokeWidth="3" strokeLinecap="round" />
            <path d="M119 110c3 3 7 3 10 0" fill="none" stroke="#512c31" strokeWidth="3" strokeLinecap="round" />
            <path d="M106 122c5 4 11 4 16 0" fill="none" stroke="#d16c63" strokeWidth="3" strokeLinecap="round" />
            <circle cx="91" cy="120" r="6" fill="#f39b88" opacity=".65" />
            <circle cx="141" cy="120" r="6" fill="#f39b88" opacity=".65" />
            <path d="M76 149c9-7 19-10 31-10 14 0 25 4 35 12l-3 34H75z" fill="#f59e22" />
            <path d="M78 151c8 9 17 13 29 14" fill="none" stroke="#ffbd54" strokeWidth="5" strokeLinecap="round" opacity=".8" />
          </g>

          <g>
            <path d="M92 164h82c6 0 10 4 10 10v36H92z" fill="#101827" stroke="#0a101b" strokeWidth="4" />
            <rect x="103" y="174" width="61" height="23" rx="3" fill="#243650" />
            <path d="M113 181h29" stroke="#6b8db7" strokeWidth="3" strokeLinecap="round" />
            <path d="M112 189h18" stroke="#4f6f98" strokeWidth="3" strokeLinecap="round" />
            <path d="M85 211h104l-10 8H95z" fill="#172033" />
            <path d="M130 214h16" stroke="#f59e22" strokeWidth="3" strokeLinecap="round" />
          </g>
        </svg>
      </span>
    );
  }

  return (
    <span className={`wt-logo wt-logo-horizontal ${className ?? ''}`} aria-label="WorkTrack">
      <svg className="wt-logo-svg wt-logo-horizontal-svg" viewBox="0 0 650 220" role="img" aria-hidden="true">
        <g transform="translate(0 0)">
          <circle cx="139" cy="91" r="67" fill="#f7f9fc" />
          <path d="M93 44 A67 67 0 0 1 178 143" fill="none" stroke="#f59e22" strokeWidth="13" strokeLinecap="round" />
          <g stroke="#172033" strokeWidth="6" strokeLinecap="round">
            <path d="M139 42v11" /><path d="M188 91h-11" /><path d="M139 140v-11" /><path d="M90 91h11" />
          </g>
          <path d="M139 91l-19 21 31-35" fill="none" stroke="#172033" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="139" cy="91" r="5" fill="#172033" />
          <path d="M59 113c-2-28 13-52 39-59 17-5 34 2 45 15l-7 59H68z" fill="#2a1720" />
          <path d="M58 111c1-16 8-29 20-39 8-7 18-11 30-12-4 8-10 14-18 19 13-5 25-5 37-2-7 7-15 12-25 15 11 0 20 3 29 8-12 10-28 14-48 11z" fill="#3a2029" />
          <path d="M79 103c0-19 13-31 31-31 19 0 32 13 32 32v21c0 21-14 34-32 34-18 0-31-13-31-34z" fill="#ffc3a6" />
          <path d="M81 101c5-24 17-34 35-34 16 0 27 8 32 23-11-6-22-8-34-5-10 2-19 8-27 16z" fill="#2b1820" />
          <path d="M101 110c3 3 7 3 10 0M119 110c3 3 7 3 10 0" fill="none" stroke="#512c31" strokeWidth="3" strokeLinecap="round" />
          <path d="M106 122c5 4 11 4 16 0" fill="none" stroke="#d16c63" strokeWidth="3" strokeLinecap="round" />
          <circle cx="91" cy="120" r="6" fill="#f39b88" opacity=".65" /><circle cx="141" cy="120" r="6" fill="#f39b88" opacity=".65" />
          <path d="M76 149c9-7 19-10 31-10 14 0 25 4 35 12l-3 34H75z" fill="#f59e22" />
          <path d="M92 164h82c6 0 10 4 10 10v36H92z" fill="#101827" stroke="#0a101b" strokeWidth="4" />
          <rect x="103" y="174" width="61" height="23" rx="3" fill="#243650" />
          <path d="M113 181h29M112 189h18" stroke="#6b8db7" strokeWidth="3" strokeLinecap="round" />
          <path d="M85 211h104l-10 8H95z" fill="#172033" /><path d="M130 214h16" stroke="#f59e22" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g transform="translate(225 64)">
          <text x="0" y="54" fontFamily="Space Grotesk, Inter, Arial, sans-serif" fontSize="56" fontWeight="700" letterSpacing="-2" fill="#f1f3f6">Work</text>
          <text x="151" y="54" fontFamily="Space Grotesk, Inter, Arial, sans-serif" fontSize="56" fontWeight="700" letterSpacing="-2" fill="#f59e22">Track</text>
          <text x="2" y="86" fontFamily="Inter, Arial, sans-serif" fontSize="13" fontWeight="700" letterSpacing="4" fill="#9aa4b2">PLAN · TRACK · LEARN · GROW</text>
        </g>
      </svg>
    </span>
  );
}
