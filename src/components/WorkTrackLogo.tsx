import type { CSSProperties } from 'react';

type WorkTrackLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'mark';
  className?: string;
};

const sizes = {
  sm: {
    mark: 28,
    text: 18,
  },
  md: {
    mark: 34,
    text: 21,
  },
  lg: {
    mark: 48,
    text: 28,
  },
} as const;

export function WorkTrackLogo({
  size = 'md',
  variant = 'full',
  className = '',
}: WorkTrackLogoProps) {
  const dimensions = sizes[size];

  const markStyle: CSSProperties = {
    width: dimensions.mark,
    height: dimensions.mark,
    flexShrink: 0,
  };

  return (
    <div
      className={`worktrack-logo worktrack-logo--${size} ${className}`.trim()}
      aria-label="WorkTrack"
    >
      <svg
        style={markStyle}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M7 11L15 35L24 17L33 35L41 11"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M31 35H41V25"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {variant === 'full' && (
        <span
          className="worktrack-logo__wordmark"
          style={{ fontSize: dimensions.text }}
        >
          WorkTrack
        </span>
      )}
    </div>
  );
}
