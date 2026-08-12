import { Timestamp } from "firebase/firestore";

export const firebaseHelpers = {
  toDate: (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  },
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
  toTimestamp: (date: Date | string | number): Timestamp => {
    return Timestamp.fromDate(new Date(date));
  }
};
