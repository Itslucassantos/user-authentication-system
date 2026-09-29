export default /* GraphQL */ `
  directive @auth(permission: String!) on FIELD_DEFINITION

  type Query {
    _empty: Boolean
  }

  type Mutation {
    _empty: Boolean
  }

  type PageInfo {
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }
`;
