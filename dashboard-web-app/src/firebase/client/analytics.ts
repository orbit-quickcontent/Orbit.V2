import { logEvent } from "firebase/analytics";
import { getAnalyticsInstance } from "./app";

export const analyticsService = {
  logPageView: async (pageName: string, path: string): Promise<void> => {
    const analytics = await getAnalyticsInstance();
    if (analytics) {
      logEvent(analytics, "page_view", {
        page_title: pageName,
        page_path: path
      });
    }
  },
  logCustomEvent: async (eventName: string, params?: Record<string, any>): Promise<void> => {
    const analytics = await getAnalyticsInstance();
    if (analytics) {
      logEvent(analytics, eventName, params);
    }
  }
};
