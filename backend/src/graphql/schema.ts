export const typeDefs = `
  type Booking {
    id: ID!
    clientId: String!
    clientName: String
    partnerId: String
    partnerName: String
    editorId: String
    editorName: String
    pickupLocation: String
    payout: Float
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  type PaginatedBookings {
    bookings: [Booking!]!
    totalCount: Int!
    hasMore: Boolean!
    nextPageCursor: String
  }

  type Query {
    bookings(status: String, limit: Int, offset: Int): PaginatedBookings!
    booking(id: ID!): Booking
  }

  type Mutation {
    updateBookingStatus(id: ID!, status: String!, partnerId: String): Booking!
  }
`;
