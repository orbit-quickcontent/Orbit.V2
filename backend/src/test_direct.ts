import { firestoreDb } from "./services/firestore-db";

async function run() {
  try {
    console.log("Direct Firestore query for partnerId = ZOSc3mAKeSJjHBV28tqv...");
    const rawBookings = await firestoreDb.bookings.findMany({
      where: { partnerId: "ZOSc3mAKeSJjHBV28tqv" }
    });
    console.log("Results count:", rawBookings.length);
    console.log("Results:", rawBookings);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
