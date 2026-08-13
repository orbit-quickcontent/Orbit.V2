export const BOOKING_STATES = [
  'PENDING',
  'PAID',
  'DISPATCHED',
  'EN_ROUTE',
  'SHOOTING',
  'SYNCING',
  'EDITING',
  'DELIVERED',
  'CANCELLED',
] as const;

export type BookingState = typeof BOOKING_STATES[number];

const transitions: Record<BookingState, readonly BookingState[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['EN_ROUTE', 'CANCELLED'],
  EN_ROUTE: ['SHOOTING', 'CANCELLED'],
  SHOOTING: ['SYNCING', 'CANCELLED'],
  SYNCING: ['EDITING', 'CANCELLED'],
  EDITING: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function isBookingState(value: unknown): value is BookingState {
  return typeof value === 'string' && (BOOKING_STATES as readonly string[]).includes(value);
}

export function canTransition(from: BookingState, to: BookingState): boolean {
  return transitions[from]?.includes(to) ?? false;
}

export function assertTransition(from: string, to: string): asserts to is BookingState {
  if (!isBookingState(from) || !isBookingState(to) || !canTransition(from, to)) {
    throw new Error(`Invalid booking transition: ${from} -> ${to}`);
  }
}

export function nextBookingState(from: string, to: string): BookingState {
  assertTransition(from, to);
  return to;
}
