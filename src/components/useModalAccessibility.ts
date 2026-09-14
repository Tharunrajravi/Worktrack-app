import { useEffect, useRef, type RefObject } from 'react';

export function useModalAccessibility<T extends HTMLElement>(
  onClose: () => void,
  initialFocus?: RefObject<T | null>,
) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTarget = initialFocus?.current ?? getFocusable(dialogRef.current)[0] ?? dialogRef.current;
    focusTarget?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusable(dialogRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [initialFocus, onClose]);

  return dialogRef;
}

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ));
}
