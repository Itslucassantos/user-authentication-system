export default /* GraphQL */ `
  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  extend type Mutation {
    login(email: String!, password: String!, clientId: String!): AuthPayload!
    refreshToken(refreshToken: String!): AuthPayload!
    logout(refreshToken: String!): Boolean!
    logoutAllDevices: Boolean! @auth(permission: "user:read")
  }
`;
