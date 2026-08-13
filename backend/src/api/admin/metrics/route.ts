import { NextResponse } from 'next/server';
import { getPlatformMetrics } from '../../../services/analytics.service';

export async function GET() {
  try {
    return NextResponse.json(await getPlatformMetrics());
  } catch (error) {
    console.error('[Metrics]', error);
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 });
  }
}
