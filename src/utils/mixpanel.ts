import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel
if (typeof window !== 'undefined') {
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (token) {
    mixpanel.init(token, {
      debug: process.env.NODE_ENV === 'development',
      track_pageview: true,
      persistence: 'localStorage',
    });
  } else {
    console.warn('Mixpanel token not found. Analytics will not work.');
  }
}

// Track events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
    mixpanel.track(eventName, properties);
  }
};

// Identify user
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
    mixpanel.identify(userId);
    if (properties) {
      mixpanel.people.set(properties);
    }
  }
};

// Set user properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
    mixpanel.people.set(properties);
  }
};

// Track page views
export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  trackEvent('Page View', {
    page: pageName,
    ...properties,
  });
};

export default mixpanel;