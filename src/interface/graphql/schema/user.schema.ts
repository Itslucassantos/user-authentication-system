export default /* GraphQL */ `
  type User {
    id: ID!
    name: String!
    email: String!
    active: Boolean!
    roles(clientApplicationId: ID): [Role!]!
  }

  type UserConnection {
    items: [User!]!
    pageInfo: PageInfo!
  }

  input CreateUserInput {
    name: String!
    email: String!
  }

  extend type Query {
    me: User
    user(id: ID!): User @auth(permission: "user:read")
    users(clientApplicationId: ID, page: Int = 1, limit: Int = 20): UserConnection!
      @auth(permission: "user:read")
  }

  extend type Mutation {
    createUser(input: CreateUserInput!): User! @auth(permission: "user:create")
    updateUser(id: ID!, name: String!): User! @auth(permission: "user:update")
    activateUser(id: ID!): User! @auth(permission: "user:update")
    deactivateUser(id: ID!): User! @auth(permission: "user:update")
    deleteUser(id: ID!): Boolean! @auth(permission: "user:delete")
    setPassword(token: String!, newPassword: String!): Boolean!
    requestPasswordReset(email: String!): Boolean!

    assignRolesToUser(userId: ID!, roleIds: [ID!]!, clientApplicationId: ID!): User!
      @auth(permission: "role:assign")
    removeRolesFromUser(userId: ID!, roleIds: [ID!]!, clientApplicationId: ID!): User!
      @auth(permission: "role:assign")
  }
`;
