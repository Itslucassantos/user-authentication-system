export default /* GraphQL */ `
  type ClientApplication {
    id: ID!
    name: String!
    clientId: ID!
    redirectUris: [String!]!
    active: Boolean!
  }

  type ClientApplicationConnection {
    items: [ClientApplication!]!
    pageInfo: PageInfo!
  }

  type ClientApplicationCreated {
    clientApplication: ClientApplication!
    clientSecret: String!
  }

  extend type Query {
    clientApplication(id: ID!): ClientApplication @auth(permission: "client-application:read")
    clientApplications(page: Int = 1, limit: Int = 20): ClientApplicationConnection!
      @auth(permission: "client-application:read")
  }

  extend type Mutation {
    createClientApplication(name: String!, redirectUris: [String!]!): ClientApplicationCreated!
      @auth(permission: "client-application:create")
    updateClientApplication(id: ID!, name: String!): ClientApplication!
      @auth(permission: "client-application:update")
    rotateClientSecret(id: ID!): ClientApplicationCreated!
      @auth(permission: "client-application:update")
    addRedirectUri(id: ID!, uri: String!): ClientApplication!
      @auth(permission: "client-application:update")
    removeRedirectUri(id: ID!, uri: String!): ClientApplication!
      @auth(permission: "client-application:update")
    activateClientApplication(id: ID!): ClientApplication!
      @auth(permission: "client-application:update")
    deactivateClientApplication(id: ID!): ClientApplication!
      @auth(permission: "client-application:update")
    deleteClientApplication(id: ID!): Boolean! @auth(permission: "client-application:delete")
  }
`;
