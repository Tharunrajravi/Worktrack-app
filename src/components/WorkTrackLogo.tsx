import React from 'react';

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
};

const HORIZONTAL_SOURCE = '/assets/worktrack-horizontal.webp';
const ICON_SOURCE = '/assets/worktrack-icon.png';

/** WorkTrack brand artwork using the supplied high-resolution image assets. */
export default function WorkTrackLogo({
  size = 42,
  showWordmark = true,
  className,
}: LogoProps) {
  if (showWordmark) {
    return (
      <span
        className={`wt-logo wt-logo-horizontal ${className ?? ''}`.trim()}
        aria-label="WorkTrack"
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          lineHeight: 0,
        }}
      >
        <img
          src={HORIZONTAL_SOURCE}
          alt="WorkTrack"
          style={{
            display: 'block',
            width: 'min(100%, 540px)',
            height: 'auto',
            objectFit: 'contain',
          }}
        />
      </span>
    );
  }

  return (
    <span
      className={`wt-logo wt-logo-icon-only ${className ?? ''}`.trim()}
      aria-label="WorkTrack"
      style={{
        display: 'inline-flex',
        width: size,
        height: size,
        flexShrink: 0,
        overflow: 'hidden',
        lineHeight: 0,
      }}
    >
      <img
        src={ICON_SOURCE}
        alt=""
        aria-hidden="true"
        style={{
          display: 'block',
          width: size,
          height: size,
          objectFit: 'contain',
        }}
      />
    </span>
  );
}
