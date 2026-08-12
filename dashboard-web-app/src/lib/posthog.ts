'use client';

import posthog from 'posthog-js';

// ─── PostHog Configuration ────────────────────────────────────────────────────
// Replace POSTHOG_PROJECT_API_KEY with your actual PostHog project API key
// Found at: posthog.com → Settings → Project API Key
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_yLLboi9NdQU9rcdQanRyCqPDxwkHtmE7kU58eerTbMho';
export const POSTHOG_HOST = 'https://us.i.posthog.com';

let initialized = false;

export function initPostHog(appName: string = 'orbit-web') {
  if (initialized || typeof window === 'undefined') return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
  });

  // Connection test event - shows up in PostHog → Activity
  posthog.capture('connection_test', {
    app: appName,
  });

  initialized = true;
  console.log(`[PostHog] Initialized for ${appName}. Check PostHog → Activity.`);
}

export { posthog };
