import { NextRequest } from 'next/server';
import { verifyPartnerCodeHandler } from '@/shared/backend/auth-handlers';

export async function POST(req: NextRequest) {
  return verifyPartnerCodeHandler(req);
}
