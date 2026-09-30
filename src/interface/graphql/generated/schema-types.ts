export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

export type GqlAuthPayload = {
  accessToken: Scalars['String']['output'];
  refreshToken: Scalars['String']['output'];
  user: GqlUser;
};

export type GqlClientApplication = {
  active: Scalars['Boolean']['output'];
  clientId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  redirectUris: Array<Scalars['String']['output']>;
};

export type GqlClientApplicationConnection = {
  items: Array<GqlClientApplication>;
  pageInfo: GqlPageInfo;
};

export type GqlClientApplicationCreated = {
  clientApplication: GqlClientApplication;
  clientSecret: Scalars['String']['output'];
};

export type GqlCreateUserInput = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type GqlMutation = {
  _empty?: Maybe<Scalars['Boolean']['output']>;
  activateClientApplication: GqlClientApplication;
  activateUser: GqlUser;
  addRedirectUri: GqlClientApplication;
  assignPermissionsToRole: GqlRole;
  assignRolesToUser: GqlUser;
  createClientApplication: GqlClientApplicationCreated;
  createPermission: GqlPermission;
  createRole: GqlRole;
  createUser: GqlUser;
  deactivateClientApplication: GqlClientApplication;
  deactivateUser: GqlUser;
  deleteClientApplication: Scalars['Boolean']['output'];
  deletePermission: Scalars['Boolean']['output'];
  deleteRole: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  login: GqlAuthPayload;
  logout: Scalars['Boolean']['output'];
  logoutAllDevices: Scalars['Boolean']['output'];
  refreshToken: GqlAuthPayload;
  removeRedirectUri: GqlClientApplication;
  removeRolesFromUser: GqlUser;
  requestPasswordReset: Scalars['Boolean']['output'];
  rotateClientSecret: GqlClientApplicationCreated;
  setPassword: Scalars['Boolean']['output'];
  updateClientApplication: GqlClientApplication;
  updatePermission: GqlPermission;
  updateRole: GqlRole;
  updateUser: GqlUser;
};

export type GqlMutationActivateClientApplicationArgs = {
  id: Scalars['ID']['input'];
};

export type GqlMutationActivateUserArgs = {
  id: Scalars['ID']['input'];
};

export type GqlMutationAddRedirectUriArgs = {
  id: Scalars['ID']['input'];
  uri: Scalars['String']['input'];
};

export type GqlMutationAssignPermissionsToRoleArgs = {
  permissionIds: Array<Scalars['ID']['input']>;
  roleId: Scalars['ID']['input'];
};

export type GqlMutationAssignRolesToUserArgs = {
  clientApplicationId: Scalars['ID']['input'];
  roleIds: Array<Scalars['ID']['input']>;
  userId: Scalars['ID']['input'];
};

export type GqlMutationCreateClientApplicationArgs = {
  name: Scalars['String']['input'];
  redirectUris: Array<Scalars['String']['input']>;
};

export type GqlMutationCreatePermissionArgs = {
  action: Scalars['String']['input'];
  clientApplicationId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  resource: Scalars['String']['input'];
};

export type GqlMutationCreateRoleArgs = {
  clientApplicationId: Scalars['ID']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  permissionIds: Array<Scalars['ID']['input']>;
};

export type GqlMutationCreateUserArgs = {
  input: GqlCreateUserInput;
};

export type GqlMutationDeactivateClientApplicationArgs = {
  id: Scalars['ID']['input'];
};

export type GqlMutationDeactivateUserArgs = {
  id: Scalars['ID']['input'];
};

export type GqlMutationDeleteClientApplicationArgs = {
  id: Scalars['ID']['input'];
};

export type GqlMutationDeletePermissionArgs = {
  id: Scalars['ID']['input'];
};

export type GqlMutationDeleteRoleArgs = {
  id: Scalars['ID']['input'];
};

export type GqlMutationDeleteUserArgs = {
  id: Scalars['ID']['input'];
};

export type GqlMutationLoginArgs = {
  clientId: Scalars['String']['input'];
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type GqlMutationLogoutArgs = {
  refreshToken: Scalars['String']['input'];
};

export type GqlMutationRefreshTokenArgs = {
  refreshToken: Scalars['String']['input'];
};

export type GqlMutationRemoveRedirectUriArgs = {
  id: Scalars['ID']['input'];
  uri: Scalars['String']['input'];
};

export type GqlMutationRemoveRolesFromUserArgs = {
  clientApplicationId: Scalars['ID']['input'];
  roleIds: Array<Scalars['ID']['input']>;
  userId: Scalars['ID']['input'];
};

export type GqlMutationRequestPasswordResetArgs = {
  email: Scalars['String']['input'];
};

export type GqlMutationRotateClientSecretArgs = {
  id: Scalars['ID']['input'];
};

export type GqlMutationSetPasswordArgs = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type GqlMutationUpdateClientApplicationArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};

export type GqlMutationUpdatePermissionArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
};

export type GqlMutationUpdateRoleArgs = {
  description: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};

export type GqlMutationUpdateUserArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};

export type GqlPageInfo = {
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type GqlPermission = {
  action: Scalars['String']['output'];
  clientApplicationId: Scalars['ID']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  resource: Scalars['String']['output'];
};

export type GqlPermissionConnection = {
  items: Array<GqlPermission>;
  pageInfo: GqlPageInfo;
};

export type GqlQuery = {
  _empty?: Maybe<Scalars['Boolean']['output']>;
  clientApplication?: Maybe<GqlClientApplication>;
  clientApplications: GqlClientApplicationConnection;
  me?: Maybe<GqlUser>;
  permission?: Maybe<GqlPermission>;
  permissions: GqlPermissionConnection;
  role?: Maybe<GqlRole>;
  roles: GqlRoleConnection;
  user?: Maybe<GqlUser>;
  users: GqlUserConnection;
};

export type GqlQueryClientApplicationArgs = {
  id: Scalars['ID']['input'];
};

export type GqlQueryClientApplicationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};

export type GqlQueryPermissionArgs = {
  id: Scalars['ID']['input'];
};

export type GqlQueryPermissionsArgs = {
  clientApplicationId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};

export type GqlQueryRoleArgs = {
  id: Scalars['ID']['input'];
};

export type GqlQueryRolesArgs = {
  clientApplicationId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};

export type GqlQueryUserArgs = {
  id: Scalars['ID']['input'];
};

export type GqlQueryUsersArgs = {
  clientApplicationId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};

export type GqlRole = {
  clientApplicationId: Scalars['ID']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  permissions: Array<GqlPermission>;
};

export type GqlRoleConnection = {
  items: Array<GqlRole>;
  pageInfo: GqlPageInfo;
};

export type GqlUser = {
  active: Scalars['Boolean']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  roles: Array<GqlRole>;
};

export type GqlUserRolesArgs = {
  clientApplicationId?: InputMaybe<Scalars['ID']['input']>;
};

export type GqlUserConnection = {
  items: Array<GqlUser>;
  pageInfo: GqlPageInfo;
};
