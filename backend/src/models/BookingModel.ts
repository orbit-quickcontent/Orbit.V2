export type BookingStatus =
  | 'PENDING_PARTNER_ACCEPTANCE'
  | 'PARTNER_ACCEPTED'
  | 'EN_ROUTE'
  | 'SHOOTING'
  | 'EDITING'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED';

export interface BookingData {
  id?: string;
  clientId: string;
  clientName?: string;
  partnerId?: string;
  partnerName?: string;
  editorId?: string;
  editorName?: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat?: number;
  destinationLng?: number;
  pickupLocation?: string;
  payout?: number;
  status: BookingStatus;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// In-memory / DB abstraction model
const inMemoryBookings = new Map<string, BookingData>();

export class BookingModel {
  static async create(data: BookingData): Promise<BookingData> {
    const id = data.id || `bk_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newBooking: BookingData = {
      ...data,
      id,
      status: data.status || 'PENDING_PARTNER_ACCEPTANCE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryBookings.set(id, newBooking);
    return newBooking;
  }

  static async findById(id: string): Promise<BookingData | null> {
    return inMemoryBookings.get(id) || null;
  }

  static async updateStatus(id: string, status: BookingStatus, partnerId?: string): Promise<BookingData | null> {
    const booking = inMemoryBookings.get(id);
    if (!booking) return null;

    booking.status = status;
    if (partnerId) {
      booking.partnerId = partnerId;
    }
    booking.updatedAt = new Date().toISOString();
    inMemoryBookings.set(id, booking);
    return booking;
  }

  static async findAll(): Promise<BookingData[]> {
    return Array.from(inMemoryBookings.values());
  }
}
