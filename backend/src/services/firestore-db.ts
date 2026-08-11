/**
 * Supabase/Prisma Database Wrapper
 * Fully replaces legacy Firestore methods with Prisma + Supabase PostgreSQL queries.
 */
import { dbClient as prisma } from './db.service';
import { supabase } from './supabase';

export const firestoreDb = {
  clientUsers: {
    findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
      try {
        if (where.id) return await (prisma as any).user.findUnique({ where: { id: where.id } });
        if (where.email) return await (prisma as any).user.findFirst({ where: { email: where.email } });
      } catch (e) {
        const { data } = await supabase.from('users').select('*').match(where as any).maybeSingle();
        return data;
      }
      return null;
    },
    findFirst: async ({ where }: { where: { email?: string; id?: string } }) => {
      return firestoreDb.clientUsers.findUnique({ where });
    },
    create: async ({ data }: { data: any }) => {
      try {
        return await (prisma as any).user.create({ data });
      } catch {
        const { data: res } = await supabase.from('users').insert(data).select().single();
        return res;
      }
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      try {
        return await (prisma as any).user.update({ where, data });
      } catch {
        const { data: res } = await supabase.from('users').update(data).eq('id', where.id).select().single();
        return res;
      }
    },
    findMany: async (args?: { where?: any }) => {
      try {
        return await (prisma as any).user.findMany(args);
      } catch {
        const { data } = await supabase.from('users').select('*');
        return data || [];
      }
    },
    upsert: async ({ where, update, create }: { where: { email: string }; update: any; create: any }) => {
      const existing = await firestoreDb.clientUsers.findUnique({ where });
      if (existing) {
        return firestoreDb.clientUsers.update({ where: { id: existing.id }, data: update });
      }
      return firestoreDb.clientUsers.create({ data: create });
    }
  },

  partnerUsers: {
    findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
      return firestoreDb.clientUsers.findUnique({ where });
    },
    findFirst: async ({ where }: { where: { email?: string; id?: string } }) => {
      return firestoreDb.clientUsers.findUnique({ where });
    },
    create: async ({ data }: { data: any }) => {
      return firestoreDb.clientUsers.create({ data: { ...data, role: 'PARTNER' } });
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      return firestoreDb.clientUsers.update({ where, data });
    },
    findMany: async (args?: { where?: any }) => {
      return firestoreDb.clientUsers.findMany(args);
    },
    upsert: async ({ where, update, create }: { where: { email: string }; update: any; create: any }) => {
      return firestoreDb.clientUsers.upsert({ where, update, create });
    }
  },

  users: {
    findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
      return firestoreDb.clientUsers.findUnique({ where });
    },
    findFirst: async ({ where }: { where: { email?: string; id?: string } }) => {
      return firestoreDb.clientUsers.findUnique({ where });
    },
    findMany: async () => {
      return firestoreDb.clientUsers.findMany();
    }
  },

  packages: {
    findMany: async () => {
      try {
        return await (prisma as any).package.findMany();
      } catch {
        const { data } = await supabase.from('packages').select('*');
        return data || [];
      }
    },
    findUnique: async ({ where }: { where: { id?: string; tier?: string } }) => {
      try {
        return await (prisma as any).package.findFirst({ where });
      } catch {
        const { data } = await supabase.from('packages').select('*').match(where as any).maybeSingle();
        return data;
      }
    },
    findFirst: async ({ where }: { where: { id?: string; tier?: string } }) => {
      return firestoreDb.packages.findUnique({ where });
    },
    create: async ({ data }: { data: any }) => {
      try {
        return await (prisma as any).package.create({ data });
      } catch {
        const { data: res } = await supabase.from('packages').insert(data).select().single();
        return res;
      }
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      try {
        return await (prisma as any).package.update({ where, data });
      } catch {
        const { data: res } = await supabase.from('packages').update(data).eq('id', where.id).select().single();
        return res;
      }
    },
    upsert: async ({ where, update, create }: { where: { tier: string }; update: any; create: any }) => {
      const existing = await firestoreDb.packages.findUnique({ where });
      if (existing) {
        return firestoreDb.packages.update({ where: { id: existing.id }, data: update });
      }
      return firestoreDb.packages.create({ data: create });
    }
  },

  bookings: {
    findMany: async (args?: { where?: any; orderBy?: any }) => {
      try {
        return await (prisma as any).booking.findMany(args);
      } catch {
        const { data } = await supabase.from('bookings').select('*');
        return data || [];
      }
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      try {
        return await (prisma as any).booking.findUnique({ where });
      } catch {
        const { data } = await supabase.from('bookings').select('*').eq('id', where.id).maybeSingle();
        return data;
      }
    },
    findFirst: async ({ where }: { where: { id: string } }) => {
      return firestoreDb.bookings.findUnique({ where });
    },
    create: async ({ data }: { data: any }) => {
      try {
        return await (prisma as any).booking.create({ data });
      } catch {
        const { data: res } = await supabase.from('bookings').insert(data).select().single();
        return res;
      }
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      try {
        return await (prisma as any).booking.update({ where, data });
      } catch {
        const { data: res } = await supabase.from('bookings').update(data).eq('id', where.id).select().single();
        return res;
      }
    }
  },

  partners: {
    findMany: async (args?: { where?: any }) => {
      try {
        return await (prisma as any).partnerProfile.findMany(args);
      } catch {
        const { data } = await supabase.from('partner_profiles').select('*');
        return data || [];
      }
    },
    findUnique: async ({ where }: { where: { id?: string; userId?: string } }) => {
      try {
        return await (prisma as any).partnerProfile.findFirst({ where });
      } catch {
        const { data } = await supabase.from('partner_profiles').select('*').match(where as any).maybeSingle();
        return data;
      }
    },
    findFirst: async ({ where }: { where: { id?: string; userId?: string } }) => {
      return firestoreDb.partners.findUnique({ where });
    },
    create: async ({ data }: { data: any }) => {
      try {
        return await (prisma as any).partnerProfile.create({ data });
      } catch {
        const { data: res } = await supabase.from('partner_profiles').insert(data).select().single();
        return res;
      }
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      try {
        return await (prisma as any).partnerProfile.update({ where, data });
      } catch {
        const { data: res } = await supabase.from('partner_profiles').update(data).eq('id', where.id).select().single();
        return res;
      }
    },
    upsert: async ({ where, update, create }: { where: { userId: string }; update: any; create: any }) => {
      const existing = await firestoreDb.partners.findUnique({ where });
      if (existing) {
        return firestoreDb.partners.update({ where: { id: existing.id }, data: update });
      }
      return firestoreDb.partners.create({ data: create });
    }
  },

  workDispatches: {
    findMany: async (args?: { where?: any }) => {
      try {
        return await (prisma as any).workDispatch.findMany(args);
      } catch {
        const { data } = await supabase.from('work_dispatches').select('*');
        return data || [];
      }
    },
    findFirst: async ({ where }: { where: { bookingId?: string; partnerId?: string; status?: string } }) => {
      const list = await firestoreDb.workDispatches.findMany({ where });
      return list.length > 0 ? list[0] : null;
    },
    create: async ({ data }: { data: any }) => {
      try {
        return await (prisma as any).workDispatch.create({ data });
      } catch {
        const { data: res } = await supabase.from('work_dispatches').insert(data).select().single();
        return res;
      }
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      try {
        return await (prisma as any).workDispatch.update({ where, data });
      } catch {
        const { data: res } = await supabase.from('work_dispatches').update(data).eq('id', where.id).select().single();
        return res;
      }
    },
    updateMany: async ({ where, data }: { where: any; data: any }) => {
      const list = await firestoreDb.workDispatches.findMany({ where });
      await Promise.all(list.map(item => firestoreDb.workDispatches.update({ where: { id: item.id }, data })));
      return { count: list.length };
    }
  },

  transactions: {
    findMany: async (args?: { where?: any; orderBy?: any }) => {
      try {
        return await (prisma as any).transaction.findMany(args);
      } catch {
        const { data } = await supabase.from('partner_transactions').select('*');
        return data || [];
      }
    },
    create: async ({ data }: { data: any }) => {
      try {
        return await (prisma as any).transaction.create({ data });
      } catch {
        const { data: res } = await supabase.from('partner_transactions').insert(data).select().single();
        return res;
      }
    }
  },

  clientAuditLogs: {
    create: async ({ data }: { data: any }) => {
      const { data: res } = await supabase.from('client_audit_logs').insert(data).select().single();
      return res;
    },
    findMany: async () => {
      const { data } = await supabase.from('client_audit_logs').select('*');
      return data || [];
    }
  },

  partnerAuditLogs: {
    create: async ({ data }: { data: any }) => {
      const { data: res } = await supabase.from('partner_audit_logs').insert(data).select().single();
      return res;
    },
    findMany: async () => {
      const { data } = await supabase.from('partner_audit_logs').select('*');
      return data || [];
    }
  },

  emailOtps: {
    findFirst: async ({ where }: { where: { email: string; otp?: string; verified?: boolean; used?: boolean } }) => {
      const { data } = await supabase.from('email_otps').select('*').match(where as any).maybeSingle();
      return data;
    },
    create: async ({ data }: { data: any }) => {
      const { data: res } = await supabase.from('email_otps').insert(data).select().single();
      return res;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const { data: res } = await supabase.from('email_otps').update(data).eq('id', where.id).select().single();
      return res;
    }
  },

  custom: (colName: string) => ({
    findUnique: async ({ where }: { where: { id: string } }) => {
      const { data } = await supabase.from(colName).select('*').eq('id', where.id).maybeSingle();
      return data;
    },
    create: async ({ data }: { data: any }) => {
      const { data: res } = await supabase.from(colName).insert(data).select().single();
      return res;
    }
  })
};
