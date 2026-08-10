import { BookingModel, BookingStatus } from '../models/BookingModel';
import { typeDefs } from '../graphql/schema';

export const resolvers = {
  Query: {
    bookings: async (_: any, { status, limit = 10, offset = 0 }: { status?: string; limit?: number; offset?: number }) => {
      let all = await BookingModel.findAll();
      if (status) {
        all = all.filter((b) => b.status === status);
      }
      const totalCount = all.length;
      const paginated = all.slice(offset, offset + limit);
      const hasMore = offset + limit < totalCount;
      const nextPageCursor = hasMore ? String(offset + limit) : null;

      return {
        bookings: paginated,
        totalCount,
        hasMore,
        nextPageCursor,
      };
    },

    booking: async (_: any, { id }: { id: string }) => {
      return await BookingModel.findById(id);
    },
  },

  Mutation: {
    updateBookingStatus: async (
      _: any,
      { id, status, partnerId }: { id: string; status: string; partnerId?: string }
    ) => {
      return await BookingModel.updateStatus(id, status as BookingStatus, partnerId);
    },
  },
};

export { typeDefs };
