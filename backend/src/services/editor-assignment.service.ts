import { dbClient } from './db.service';
import { notifyClient } from './websocket.service';

export async function assignEditor(bookingId: string): Promise<string> {
  const editors = await dbClient.user.findMany({
    where: { role: 'EDITOR', status: 'ACTIVE', deletedAt: null },
    select: { id: true, name: true },
  });
  if (!editors.length) throw new Error('No active editor available');

  const counts = await Promise.all(editors.map(async (editor) => ({
    editor,
    count: await dbClient.booking.count({
      where: { editorId: editor.id, status: { in: ['SYNCING', 'EDITING'] } },
    }),
  })));
  counts.sort((a, b) => a.count - b.count);
  const selected = counts[0].editor;

  await dbClient.booking.update({
    where: { id: bookingId },
    data: { editorId: selected.id, editorAssignedAt: new Date() },
  });

  notifyClient({
    bookingId,
    event: 'booking:editor-assigned',
    data: { bookingId, editorId: selected.id, editorName: selected.name },
  });

  return selected.id;
}
