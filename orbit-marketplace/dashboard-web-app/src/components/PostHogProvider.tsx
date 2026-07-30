'use client';

import { useEffect } from 'react';
import { initPostHog } from '@/lib/posthog';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Fires connection_test { app: 'orbit-dashboard' } on first load
    initPostHog('orbit-dashboard');
  }, []);

  return <>{children}</>;
}
