import { Request, Response } from 'express';
import { generateJwtToken } from '../middleware/auth';
import { PrismaClient, PartnerStatus } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export const loginSchema = z.object({
  email: z.string().email(),
  role: z.enum(['PARTNER', 'CLIENT', 'ADMIN']).default('PARTNER'),
});

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, role } = req.body;

  try {
    let partnerId: string | undefined;

    if (role === 'PARTNER') {
      let partner = await prisma.partner.findFirst({ where: { email } });

      if (!partner) {
        partner = await prisma.partner.create({
          data: {
            name: email.split('@')[0],
            email,
            phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
            vehicleType: 'Sony FX3 Cinema Rig',
            status: PartnerStatus.OFFLINE,
            rating: 4.9,
            latitude: 19.076,
            longitude: 72.8777,
          },
        });
      }
      partnerId = partner.id;
    }

    const token = generateJwtToken({
      id: partnerId || `user-${Date.now()}`,
      email,
      role: role as 'PARTNER' | 'CLIENT' | 'ADMIN',
      partnerId,
    });

    res.status(200).json({
      success: true,
      token,
      accessToken: token,
      refreshToken: token,
      user: {
        id: partnerId || 'client-id',
        email,
        role,
        partnerId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
}

export async function googleAuthHandler(req: Request, res: Response): Promise<void> {
  const { email, name, photoURL, role = 'PARTNER' } = req.body;

  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Valid email is required for Google authentication' });
    return;
  }

  try {
    let partnerId: string | undefined;

    if (role === 'PARTNER') {
      let partner = await prisma.partner.findFirst({ where: { email } });

      if (!partner) {
        partner = await prisma.partner.create({
          data: {
            name: name || email.split('@')[0],
            email,
            phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
            vehicleType: 'Sony FX3 Cinema Rig',
            status: PartnerStatus.OFFLINE,
            rating: 5.0,
            latitude: 19.076,
            longitude: 72.8777,
          },
        });
      }
      partnerId = partner.id;
    }

    const token = generateJwtToken({
      id: partnerId || `google-usr-${Date.now()}`,
      email,
      role: role as 'PARTNER' | 'CLIENT' | 'ADMIN',
      partnerId,
    });

    res.status(200).json({
      success: true,
      token,
      accessToken: token,
      refreshToken: token,
      user: {
        id: partnerId || 'client-id',
        email,
        name: name || 'Google User',
        photoURL: photoURL || null,
        role,
        partnerId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Google Auth failed' });
  }
}

export async function appleAuthHandler(req: Request, res: Response): Promise<void> {
  const { email, name, role = 'PARTNER' } = req.body;

  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Valid email is required for Apple authentication' });
    return;
  }

  try {
    let partnerId: string | undefined;

    if (role === 'PARTNER') {
      let partner = await prisma.partner.findFirst({ where: { email } });

      if (!partner) {
        partner = await prisma.partner.create({
          data: {
            name: name || email.split('@')[0],
            email,
            phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
            vehicleType: 'Sony FX3 Cinema Rig',
            status: PartnerStatus.OFFLINE,
            rating: 5.0,
            latitude: 19.076,
            longitude: 72.8777,
          },
        });
      }
      partnerId = partner.id;
    }

    const token = generateJwtToken({
      id: partnerId || `apple-usr-${Date.now()}`,
      email,
      role: role as 'PARTNER' | 'CLIENT' | 'ADMIN',
      partnerId,
    });

    res.status(200).json({
      success: true,
      token,
      accessToken: token,
      refreshToken: token,
      user: {
        id: partnerId || 'client-id',
        email,
        name: name || 'Apple User',
        role,
        partnerId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Apple Auth failed' });
  }
}
