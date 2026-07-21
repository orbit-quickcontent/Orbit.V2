import { Timestamp } from "firebase/firestore";

export const firebaseHelpers = {
  /**
   * Convert a Firestore Timestamp object safely to standard JS Date object
   */
  toDate: (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }
    if (timestamp.seconds !== undefined) {
      return new Timestamp(timestamp.seconds, timestamp.nanoseconds || 0).toDate();
    }
    return new Date(timestamp);
  },

  /**
   * Parse deep dates of a Firestore document object recursively
   */
  parseDates: (data: any): any => {
    if (!data || typeof data !== "object") return data;
    const parsed = { ...data };
    for (const key of Object.keys(parsed)) {
      const val = parsed[key];
      if (val && typeof val === "object" && (val instanceof Timestamp || typeof val.toDate === "function")) {
        parsed[key] = firebaseHelpers.toDate(val)?.toISOString();
      } else if (typeof val === "object") {
        parsed[key] = firebaseHelpers.parseDates(val);
      }
    }
    return parsed;
  },

  /**
   * Convert standard js Date objects to Firebase Firestore timestamps
   */
  toTimestamp: (date: Date | string | number): Timestamp => {
    return Timestamp.fromDate(new Date(date));
  }
};
