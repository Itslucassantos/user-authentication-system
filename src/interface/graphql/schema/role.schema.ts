export default /* GraphQL */ `
  type Role {
    id: ID!
    clientApplicationId: ID!
    name: String!
    description: String!
    permissions: [Permission!]!
  }

  type RoleConnection {
    items: [Role!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    role(id: ID!): Role @auth(permission: "role:read")
    roles(clientApplicationId: ID!, page: Int = 1, limit: Int = 20): RoleConnection!
      @auth(permission: "role:read")
  }

  extend type Mutation {
    createRole(
      name: String!
      description: String!
      clientApplicationId: ID!
      permissionIds: [ID!]!
    ): Role! @auth(permission: "role:create")
    updateRole(id: ID!, name: String!, description: String!): Role! @auth(permission: "role:update")
    assignPermissionsToRole(roleId: ID!, permissionIds: [ID!]!): Role!
      @auth(permission: "role:assign")
    deleteRole(id: ID!): Boolean! @auth(permission: "role:delete")
  }
`;
