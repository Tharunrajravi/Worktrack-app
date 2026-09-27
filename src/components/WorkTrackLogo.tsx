type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  compact?: boolean;
  className?: string;
};

/**
 * WorkTrack brand mark.
 * The artwork is kept as image assets so the UI uses the supplied reference artwork
 * instead of a hand-redrawn approximation.
 */
export default function WorkTrackLogo({ size = 52, showWordmark = true, className }: LogoProps) {
  const src = showWordmark ? '/assets/worktrack-horizontal.webp' : '/assets/worktrack-icon.png';

  return (
    <span
      className={`wt-logo ${showWordmark ? 'wt-logo-horizontal' : 'wt-logo-icon-only'} ${className ?? ''}`}
      aria-label="WorkTrack"
    >
      <img
        className="wt-logo-art"
        src={src}
        alt="WorkTrack"
        style={showWordmark ? undefined : { width: size, height: size }}
      />
    </span>
  );
}
