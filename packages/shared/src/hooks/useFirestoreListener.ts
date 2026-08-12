import { useState, useEffect } from 'react';

export interface BookingState {
  id: string;
  clientId: string;
  clientName: string;
  partnerId?: string;
  partnerName?: string;
  editorId?: string;
  editorName?: string;
  status:
    | 'PENDING_PARTNER_ACCEPTANCE'
    | 'PARTNER_ACCEPTED'
    | 'EN_ROUTE'
    | 'SHOOTING'
    | 'EDITING'
    | 'DELIVERED'
    | 'REJECTED'
    | 'CANCELLED';
  pickupLocation: string;
  payout: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Custom hook to listen for real-time Firestore or WebSocket booking state updates.
 */
export function useFirestoreListener(bookingId: string | null) {
  const [booking, setBooking] = useState<BookingState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Initial mock fetch / socket subscription simulation
    const timer = setTimeout(() => {
      setBooking({
        id: bookingId,
        clientId: 'client-101',
        clientName: 'Alex Morgan',
        status: 'PENDING_PARTNER_ACCEPTANCE',
        pickupLocation: '742 Evergreen Terrace, Sector 4',
        payout: 120.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [bookingId]);

  const updateBookingStatus = (newStatus: BookingState['status']) => {
    setBooking((prev) =>
      prev
        ? {
            ...prev,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          }
        : null
    );
  };

  return { booking, loading, error, updateBookingStatus };
}
