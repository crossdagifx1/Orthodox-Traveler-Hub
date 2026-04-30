import { useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  userId?: string;
  timestamp: number;
}

// Simple analytics hook - can be extended with Plausible, PostHog, etc.
export function useAnalytics() {
  const { user } = useAuth();

  const track = useCallback((name: string, properties?: Record<string, unknown>) => {
    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        userId: user?.id,
        anonymousId: getAnonymousId(),
      },
      timestamp: Date.now(),
    };

    // Send to analytics endpoint
    if (import.meta.env.PROD) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(console.error);
    } else {
      console.log('[Analytics]', event);
    }
  }, [user?.id]);

  const trackPageView = useCallback((path: string, title?: string) => {
    track('page_view', {
      path,
      title,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    });
  }, [track]);

  const trackEvent = useCallback((name: string, properties?: Record<string, unknown>) => {
    track(name, properties);
  }, [track]);

  const trackConversion = useCallback((name: string, value?: number, properties?: Record<string, unknown>) => {
    track(name, {
      ...properties,
      value,
      currency: 'USD',
    });
  }, [track]);

  return {
    trackPageView,
    trackEvent,
    trackConversion,
  };
}

// Get or create anonymous ID
function getAnonymousId(): string {
  let id = localStorage.getItem('analytics_anonymous_id');
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('analytics_anonymous_id', id);
  }
  return id;
}

// Hook to auto-track page views
export function usePageTracking(path: string, title?: string) {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView(path, title);
  }, [path, title, trackPageView]);
}

// Hook to track user engagement
export function useEngagementTracking() {
  const { trackEvent } = useAnalytics();

  const trackClick = useCallback((element: string, context?: string) => {
    trackEvent('click', { element, context });
  }, [trackEvent]);

  const trackScroll = useCallback((depth: number) => {
    trackEvent('scroll', { depth });
  }, [trackEvent]);

  const trackTimeOnPage = useCallback((duration: number) => {
    trackEvent('time_on_page', { duration });
  }, [trackEvent]);

  const trackFormSubmit = useCallback((formName: string, properties?: Record<string, unknown>) => {
    trackEvent('form_submit', { form: formName, ...properties });
  }, [trackEvent]);

  const trackError = useCallback((error: Error, context?: string) => {
    trackEvent('error', {
      message: error.message,
      stack: error.stack,
      context,
    });
  }, [trackEvent]);

  return {
    trackClick,
    trackScroll,
    trackTimeOnPage,
    trackFormSubmit,
    trackError,
  };
}

// Performance tracking
export function usePerformanceTracking() {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (!window.performance) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          trackEvent('performance', {
            type: 'navigation',
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            totalLoadTime: navEntry.loadEventEnd - navEntry.fetchStart,
          });
        } else if (entry.entryType === 'paint') {
          trackEvent('performance', {
            type: 'paint',
            name: entry.name,
            duration: entry.duration,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['navigation', 'paint'] });

    return () => observer.disconnect();
  }, [trackEvent]);
}

// Core Web Vitals tracking (optional - requires web-vitals package)
export function useWebVitals() {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // web-vitals is optional - skip if not installed
    // To enable: pnpm add web-vitals
    try {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = require('web-vitals');
      getCLS((metric: { value: number }) => trackEvent('web_vital', { name: 'CLS', value: metric.value }));
      getFID((metric: { value: number }) => trackEvent('web_vital', { name: 'FID', value: metric.value }));
      getFCP((metric: { value: number }) => trackEvent('web_vital', { name: 'FCP', value: metric.value }));
      getLCP((metric: { value: number }) => trackEvent('web_vital', { name: 'LCP', value: metric.value }));
      getTTFB((metric: { value: number }) => trackEvent('web_vital', { name: 'TTFB', value: metric.value }));
    } catch {
      // web-vitals not installed - skip silently
    }
  }, [trackEvent]);
}
