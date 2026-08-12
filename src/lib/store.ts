import { create } from 'zustand'
import { supabase } from './supabase'
import type { Booking, Package, Partner, Editor, Earning, Role } from './types'

interface AppState {
  role: Role
  setRole: (r: Role) => void
  bookings: Booking[]
  packages: Package[]
  partners: Partner[]
  editors: Editor[]
  earnings: Earning[]
  fetchPackages: () => Promise<void>
  fetchPartners: () => Promise<void>
  fetchEditors: () => Promise<void>
  fetchBookings: () => Promise<void>
  fetchEarnings: () => Promise<void>
  subscribeToBookings: () => () => void
  createBooking: (data: Partial<Booking>) => Promise<Booking | null>
  updateBookingStatus: (id: string, status: string, extra?: Partial<Booking>) => Promise<void>
  acceptBookingByPartner: (bookingId: string, partner: Partner) => Promise<void>
  acceptBookingByEditor: (bookingId: string, editor: Editor) => Promise<void>
  uploadFootage: (bookingId: string, url: string) => Promise<void>
  deliverReel: (bookingId: string, url: string) => Promise<void>
  cancelBooking: (id: string) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  role: 'none' as Role,
  setRole: (r) => set({ role: r }),
  bookings: [],
  packages: [],
  partners: [],
  editors: [],
  earnings: [],

  fetchPackages: async () => {
    const { data } = await supabase.from('packages').select('*').eq('active', true).order('price')
    if (data) set({ packages: data as Package[] })
  },
  fetchPartners: async () => {
    const { data } = await supabase.from('partners').select('*').order('rating', { ascending: false })
    if (data) set({ partners: data as Partner[] })
  },
  fetchEditors: async () => {
    const { data } = await supabase.from('editors').select('*').order('rating', { ascending: false })
    if (data) set({ editors: data as Editor[] })
  },
  fetchBookings: async () => {
    const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
    if (data) set({ bookings: data as Booking[] })
  },
  fetchEarnings: async () => {
    const { data } = await supabase.from('earnings').select('*').order('created_at', { ascending: false })
    if (data) set({ earnings: data as Earning[] })
  },

  subscribeToBookings: () => {
    const channel = supabase
      .channel('bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        const current = get().bookings
        if (payload.eventType === 'INSERT') {
          if (!current.some((b) => b.id === payload.new.id)) {
            set({ bookings: [payload.new as Booking, ...current] })
          }
        } else if (payload.eventType === 'UPDATE') {
          set({ bookings: current.map((b) => (b.id === payload.new.id ? (payload.new as Booking) : b)) })
        } else if (payload.eventType === 'DELETE') {
          set({ bookings: current.filter((b) => b.id !== payload.old.id) })
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'earnings' }, () => { get().fetchEarnings() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, () => { get().fetchPartners() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  },

  createBooking: async (data) => {
    const { data: result, error } = await supabase.from('bookings').insert(data).select().single()
    if (error) { console.error('Create booking error:', error); return null }
    return result as Booking
  },

  updateBookingStatus: async (id, status, extra) => {
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString(), ...extra }
    if (status === 'DELIVERED') updates.delivered_at = new Date().toISOString()
    const { error } = await supabase.from('bookings').update(updates).eq('id', id)
    if (error) console.error('Update booking error:', error)
  },

  acceptBookingByPartner: async (bookingId, partner) => {
    const { error } = await supabase.from('bookings').update({
      status: 'ACCEPTED_BY_PARTNER', partner_id: partner.id, partner_name: partner.name,
      accepted_by_partner_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', bookingId)
    if (error) console.error('Accept by partner error:', error)
  },

  acceptBookingByEditor: async (bookingId, editor) => {
    const { error } = await supabase.from('bookings').update({
      status: 'EDITING', editor_id: editor.id, editor_name: editor.name,
      accepted_by_editor_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', bookingId)
    if (error) console.error('Accept by editor error:', error)
  },

  uploadFootage: async (bookingId, url) => {
    const { error } = await supabase.from('bookings').update({
      status: 'UPLOADED', raw_footage_url: url, updated_at: new Date().toISOString(),
    }).eq('id', bookingId)
    if (error) console.error('Upload footage error:', error)
  },

  deliverReel: async (bookingId, url) => {
    const { data: booking, error: bErr } = await supabase.from('bookings').update({
      status: 'DELIVERED', reel_url: url,
      delivered_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', bookingId).select().single()
    if (bErr) { console.error('Deliver reel error:', bErr); return }

    const b = booking as Booking
    if (!b?.partner_id) return

    await supabase.from('earnings').insert({
      partner_id: b.partner_id, booking_id: b.id, amount: b.partner_earnings, status: 'PENDING',
    })

    const { data: partner } = await supabase.from('partners').select('total_earnings, completed_jobs').eq('id', b.partner_id).single()
    if (partner) {
      await supabase.from('partners').update({
        total_earnings: (partner.total_earnings || 0) + b.partner_earnings,
        completed_jobs: (partner.completed_jobs || 0) + 1,
      }).eq('id', b.partner_id)
    }
  },

  cancelBooking: async (id) => {
    const { error } = await supabase.from('bookings').update({
      status: 'CANCELLED', payment_status: 'REFUNDED', updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) console.error('Cancel booking error:', error)
  },
}))
