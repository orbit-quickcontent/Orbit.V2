export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED_BY_PARTNER'
  | 'SHOOTING'
  | 'UPLOADED'
  | 'ACCEPTED_BY_EDITOR'
  | 'EDITING'
  | 'DELIVERED'
  | 'CANCELLED'

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED'

export type Role = 'none' | 'client' | 'partner' | 'editor' | 'admin'

export interface Package {
  id: string
  name: string
  tier: string
  price: number
  description: string
  features: string[]
  delivery_time: string
  active: boolean
}

export interface Partner {
  id: string
  name: string
  phone: string
  location: string
  is_online: boolean
  is_verified: boolean
  avatar_url: string | null
  rating: number
  total_earnings: number
  completed_jobs: number
}

export interface Editor {
  id: string
  name: string
  phone: string
  is_online: boolean
  is_verified: boolean
  avatar_url: string | null
  rating: number
  completed_jobs: number
}

export interface Booking {
  id: string
  client_name: string
  client_phone: string | null
  client_email: string | null
  package_id: string | null
  package_name: string | null
  package_price: number
  partner_id: string | null
  partner_name: string | null
  editor_id: string | null
  editor_name: string | null
  status: BookingStatus
  booking_date: string | null
  time_slot: string | null
  location: string | null
  notes: string | null
  raw_footage_url: string | null
  reel_url: string | null
  partner_earnings: number
  payment_status: PaymentStatus
  created_at: string
  updated_at: string
  delivered_at: string | null
  accepted_by_partner_at: string | null
  accepted_by_editor_at: string | null
}

export interface Earning {
  id: string
  partner_id: string
  booking_id: string
  amount: number
  status: string
  created_at: string
  paid_at: string | null
}

export const STATUS_FLOW: BookingStatus[] = [
  'PENDING',
  'ACCEPTED_BY_PARTNER',
  'SHOOTING',
  'UPLOADED',
  'ACCEPTED_BY_EDITOR',
  'EDITING',
  'DELIVERED',
]

export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Waiting for Partner',
  ACCEPTED_BY_PARTNER: 'Partner Accepted',
  SHOOTING: 'Partner Shooting',
  UPLOADED: 'Footage Uploaded',
  ACCEPTED_BY_EDITOR: 'Editor Accepted',
  EDITING: 'Editor Editing',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

export const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  ACCEPTED_BY_PARTNER: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  SHOOTING: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  UPLOADED: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  ACCEPTED_BY_EDITOR: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  EDITING: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  DELIVERED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
}

export const PARTNER_EARNINGS = 700
