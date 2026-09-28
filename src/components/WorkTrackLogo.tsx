type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
};

/**
 * WorkTrack brand assets.
 *
 * The supplied reference artwork is kept as raster artwork rather than
 * redrawing the mascot in SVG. This preserves the exact character, clock,
 * laptop, colors, wordmark and tagline from the approved reference.
 */
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
          src="/assets/worktrack-horizontal.png"
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
        src="/assets/worktrack-icon.png"
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
