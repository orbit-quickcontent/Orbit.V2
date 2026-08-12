/**
 * Supabase Web Database Adapter Wrapper
 * Replaces legacy Firebase/Firestore methods with direct Supabase API calls.
 */
import { supabase } from './supabase';

export const firestoreDb = {
  clientUsers: {
    findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
      const { data } = await supabase.from('users').select('*').match(where as any).maybeSingle();
      return data;
    },
    findFirst: async ({ where }: { where: { email?: string; id?: string } }) => {
      return firestoreDb.clientUsers.findUnique({ where });
    },
    create: async ({ data }: { data: any }) => {
      const { data: res } = await supabase.from('users').insert(data).select().single();
      return res;
    },
    update: async ({ where, data }: { where: { id?: string; email?: string }; data: any }) => {
      const { data: res } = await supabase.from('users').update(data).match(where as any).select().single();
      return res;
    },
    upsert: async ({ where, update, create }: { where: { email?: string; id?: string }; update: any; create: any }) => {
      const existing = await firestoreDb.clientUsers.findUnique({ where });
      if (existing) {
        return firestoreDb.clientUsers.update({ where, data: update });
      }
      return firestoreDb.clientUsers.create({ data: create });
    },
    findMany: async () => {
      const { data } = await supabase.from('users').select('*');
      return data || [];
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
    update: async ({ where, data }: { where: { id?: string; email?: string }; data: any }) => {
      return firestoreDb.clientUsers.update({ where, data });
    },
    upsert: async ({ where, update, create }: { where: { email?: string; id?: string }; update: any; create: any }) => {
      return firestoreDb.clientUsers.upsert({ where, update, create: { ...create, role: 'PARTNER' } });
    },
    findMany: async () => {
      return firestoreDb.clientUsers.findMany();
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
      const { data } = await supabase.from('packages').select('*');
      return data || [];
    },
    findUnique: async ({ where }: { where: { id?: string; tier?: string } }) => {
      const { data } = await supabase.from('packages').select('*').match(where as any).maybeSingle();
      return data;
    },
    create: async ({ data }: { data: any }) => {
      const { data: res } = await supabase.from('packages').insert(data).select().single();
      return res;
    },
    update: async ({ where, data }: { where: { id?: string; tier?: string }; data: any }) => {
      const { data: res } = await supabase.from('packages').update(data).match(where as any).select().single();
      return res;
    },
    upsert: async ({ where, update, create }: { where: { id?: string; tier?: string }; update: any; create: any }) => {
      const existing = await firestoreDb.packages.findUnique({ where });
      if (existing) {
        return firestoreDb.packages.update({ where, data: update });
      }
      return firestoreDb.packages.create({ data: create });
    }
  },

  bookings: {
    findMany: async () => {
      const { data } = await supabase.from('bookings').select('*');
      return data || [];
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const { data } = await supabase.from('bookings').select('*').eq('id', where.id).maybeSingle();
      return data;
    },
    create: async ({ data }: { data: any }) => {
      const { data: res } = await supabase.from('bookings').insert(data).select().single();
      return res;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const { data: res } = await supabase.from('bookings').update(data).eq('id', where.id).select().single();
      return res;
    }
  },

  partners: {
    findMany: async () => {
      const { data } = await supabase.from('partner_profiles').select('*');
      return data || [];
    },
    findUnique: async ({ where }: { where: { id?: string; userId?: string } }) => {
      const { data } = await supabase.from('partner_profiles').select('*').match(where as any).maybeSingle();
      return data;
    },
    create: async ({ data }: { data: any }) => {
      const { data: res } = await supabase.from('partner_profiles').insert(data).select().single();
      return res;
    },
    update: async ({ where, data }: { where: { id?: string; userId?: string }; data: any }) => {
      const { data: res } = await supabase.from('partner_profiles').update(data).match(where as any).select().single();
      return res;
    },
    upsert: async ({ where, update, create }: { where: { id?: string; userId?: string }; update: any; create: any }) => {
      const existing = await firestoreDb.partners.findUnique({ where });
      if (existing) {
        return firestoreDb.partners.update({ where, data: update });
      }
      return firestoreDb.partners.create({ data: create });
    }
  }
};
