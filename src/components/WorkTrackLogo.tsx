import { useEffect, useState } from 'react';

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
};

const HORIZONTAL_SOURCE = '/assets/worktrack-horizontal.webp';
const ICON_SOURCE = '/assets/worktrack-icon.png';

/**
 * Uses the supplied WorkTrack artwork itself. The horizontal source in the
 * repository contains PNG bytes but has a .webp filename, so we fetch the
 * bytes and explicitly recreate them as an image/png Blob before rendering.
 * This avoids the broken-image result caused by the mismatched MIME type.
 */
export default function WorkTrackLogo({
  size = 42,
  showWordmark = true,
  className,
}: LogoProps) {
  const [horizontalSrc, setHorizontalSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!showWordmark) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    void fetch(HORIZONTAL_SOURCE)
      .then((response) => {
        if (!response.ok) throw new Error(`Logo request failed: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((bytes) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
        setHorizontalSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setHorizontalSrc(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [showWordmark]);

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
        {horizontalSrc ? (
          <img
            src={horizontalSrc}
            alt="WorkTrack"
            style={{
              display: 'block',
              width: 'min(100%, 540px)',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        ) : (
          <span aria-hidden="true" style={{ width: 1, height: 1 }} />
        )}
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
