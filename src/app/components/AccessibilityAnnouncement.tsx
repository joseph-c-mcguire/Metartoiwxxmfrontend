import { useEffect, useRef } from 'react';

/**
 * Accessibility Announcement Hook
 * 
 * Announces messages to screen readers without visual display
 * 
 * Usage:
 * const announce = useAccessibilityAnnouncement();
 * 
 * // Later in your code
 * announce('File uploaded successfully');
 */
export function useAccessibilityAnnouncement() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcement region if it doesn't exist
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.id = 'accessibility-announcer';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    return () => {
      // Cleanup on unmount
      if (announcerRef.current && document.body.contains(announcerRef.current)) {
        document.body.removeChild(announcerRef.current);
        announcerRef.current = null;
      }
    };
  }, []);

  const announce = (message: string, options?: {
    politeness?: 'polite' | 'assertive';
    clearAfter?: number;
  }) => {
    if (!announcerRef.current) return;

    const { politeness = 'polite', clearAfter = 3000 } = options || {};

    // Update politeness if needed
    announcerRef.current.setAttribute('aria-live', politeness);

    // Set the message
    announcerRef.current.textContent = message;

    // Clear after specified time
    if (clearAfter > 0) {
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = '';
        }
      }, clearAfter);
    }
  };

  return announce;
}

/**
 * Global Accessibility Announcer
 * 
 * Include this once at the root of your app to enable
 * announcements from anywhere using the window object
 * 
 * Usage in App.tsx:
 * <AccessibilityProvider />
 * 
 * Then anywhere:
 * window.announceToScreenReader?.('Message');
 */
export function AccessibilityProvider() {
  const announce = useAccessibilityAnnouncement();

  useEffect(() => {
    // Make announce function globally available
    (window as any).announceToScreenReader = announce;

    return () => {
      delete (window as any).announceToScreenReader;
    };
  }, [announce]);

  return null;
}

/**
 * Declare global type for TypeScript
 */
declare global {
  interface Window {
    announceToScreenReader?: (message: string, options?: {
      politeness?: 'polite' | 'assertive';
      clearAfter?: number;
    }) => void;
  }
}
