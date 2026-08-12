/**
 * Shared GraphQL query string constants and helper client queries
 */

export const GET_BOOKINGS_PAGINATED = `
  query GetBookingsPaginated($status: String, $limit: Int, $offset: Int) {
    bookings(status: $status, limit: $limit, offset: $offset) {
      bookings {
        id
        clientId
        clientName
        status
        pickupLocation
        payout
        createdAt
      }
      totalCount
      hasMore
      nextPageCursor
    }
  }
`;

export const GET_BOOKING_BY_ID = `
  query GetBookingById($id: ID!) {
    booking(id: $id) {
      id
      clientId
      clientName
      partnerId
      partnerName
      status
      pickupLocation
      payout
      createdAt
      updatedAt
    }
  }
`;
