import { NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";

export async function GET() {
  try {
    const [clientLogsRaw, partnerLogsRaw, clientUsers, partnerUsers] = await Promise.all([
      firestoreDb.clientAuditLogs.findMany(),
      firestoreDb.partnerAuditLogs.findMany(),
      firestoreDb.clientUsers.findMany(),
      firestoreDb.partnerUsers.findMany()
    ]);

    const userMap = new Map<string, { name: string | null; email: string }>();
    clientUsers.forEach((u) => {
      userMap.set(u.id, { name: u.name || null, email: u.email });
    });
    partnerUsers.forEach((u) => {
      userMap.set(u.id, { name: u.name || null, email: u.email });
    });

    const clientLogs = clientLogsRaw.map((log) => {
      const user = log.userId ? userMap.get(log.userId) : null;
      return {
        ...log,
        user: user || null
      };
    });

    const partnerLogs = partnerLogsRaw.map((log) => {
      const user = log.userId ? userMap.get(log.userId) : null;
      return {
        ...log,
        user: user || null
      };
    });

    const logs = [...clientLogs, ...partnerLogs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100);

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
