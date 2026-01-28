import { useEffect, useRef } from 'react';

interface ScreenReaderAnnouncerProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  clearOnUnmount?: boolean;
}

/**
 * Screen Reader Announcer Component
 * Announces dynamic content changes to screen readers
 * 
 * Usage:
 * <ScreenReaderAnnouncer message="File uploaded successfully" politeness="polite" />
 */
export function ScreenReaderAnnouncer({ 
  message, 
  politeness = 'polite',
  clearOnUnmount = true 
}: ScreenReaderAnnouncerProps) {
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (announcerRef.current && message) {
      announcerRef.current.textContent = message;
    }

    return () => {
      if (clearOnUnmount && announcerRef.current) {
        announcerRef.current.textContent = '';
      }
    };
  }, [message, clearOnUnmount]);

  return (
    <div
      ref={announcerRef}
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

/**
 * Live Region Component
 * For dynamic content that needs to be announced
 */
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  label?: string;
}

export function LiveRegion({ 
  children, 
  politeness = 'polite', 
  atomic = true,
  relevant = 'additions text',
  label
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      aria-label={label}
    >
      {children}
    </div>
  );
}

/**
 * Hook to announce messages to screen readers
 */
export function useScreenReaderAnnouncement() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create a live region if it doesn't exist
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    return () => {
      if (announcerRef.current && document.body.contains(announcerRef.current)) {
        document.body.removeChild(announcerRef.current);
      }
    };
  }, []);

  const announce = (message: string, timeout = 3000) => {
    if (announcerRef.current) {
      announcerRef.current.textContent = message;
      
      // Clear after timeout
      if (timeout > 0) {
        setTimeout(() => {
          if (announcerRef.current) {
            announcerRef.current.textContent = '';
          }
        }, timeout);
      }
    }
  };

  return announce;
}

/**
 * Progress Announcer Component
 * For progress bars and loading states
 */
interface ProgressAnnouncerProps {
  value: number;
  max: number;
  label: string;
  announceEvery?: number; // Announce every X percent
}

export function ProgressAnnouncer({ 
  value, 
  max, 
  label,
  announceEvery = 25 
}: ProgressAnnouncerProps) {
  const lastAnnouncedRef = useRef<number>(-1);
  const percentage = Math.round((value / max) * 100);

  useEffect(() => {
    const shouldAnnounce = 
      percentage >= lastAnnouncedRef.current + announceEvery ||
      percentage === 100 ||
      percentage === 0;

    if (shouldAnnounce) {
      lastAnnouncedRef.current = percentage;
    }
  }, [percentage, announceEvery]);

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      aria-valuetext={`${percentage} percent complete`}
      className="sr-only"
    >
      {label}: {percentage}%
    </div>
  );
}
