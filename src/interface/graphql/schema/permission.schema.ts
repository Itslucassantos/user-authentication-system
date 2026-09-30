export default /* GraphQL */ `
  type Permission {
    id: ID!
    clientApplicationId: ID!
    name: String!
    resource: String!
    action: String!
    description: String!
  }

  type PermissionConnection {
    items: [Permission!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    permission(id: ID!): Permission @auth(permission: "permission:read")
    permissions(clientApplicationId: ID!, page: Int = 1, limit: Int = 20): PermissionConnection!
      @auth(permission: "permission:read")
  }

  extend type Mutation {
    createPermission(
      clientApplicationId: ID!
      name: String!
      resource: String!
      action: String!
      description: String
    ): Permission! @auth(permission: "permission:create")
    updatePermission(id: ID!, description: String): Permission!
      @auth(permission: "permission:update")
    deletePermission(id: ID!): Boolean! @auth(permission: "permission:delete")
  }
`;
