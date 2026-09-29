import { redis } from '../infrastructure/redis/redis-client.js';
import EventDispatcher from '../domain/@shared/event/event-dispatcher.js';
import UserCreatedEvent from '../domain/user/event/user-created.event.js';
import PasswordResetRequestedEvent from '../domain/auth/event/password-reset-requested.event.js';

import BcryptHasher from '../infrastructure/auth/hasher/bcrypt-hasher.js';
import { loadJwtConfig } from '../infrastructure/auth/jwt/jwt-config.js';
import JoseTokenService from '../infrastructure/auth/jwt/jose-token.service.js';
import RefreshTokenRepository from '../infrastructure/auth/repository/redis/refresh-token.repository.js';
import PasswordTokenRepository from '../infrastructure/auth/repository/sequelize/password-token.repository.js';
import { loadMailerConfig } from '../infrastructure/mail/mailer-config.js';
import NodemailerMailer from '../infrastructure/mail/nodemailer-mailer.js';
import RedisRateLimiter from '../infrastructure/rate-limit/redis-rate-limiter.js';
import ClientApplicationRepository from '../infrastructure/client-application/repository/sequelize/client-application.repository.js';
import RoleRepository from '../infrastructure/role/repository/sequelize/role.repository.js';
import PermissionRepository from '../infrastructure/role/repository/sequelize/permission.repository.js';
import UserRepository from '../infrastructure/user/repository/sequelize/user.repository.js';

import SendInvitationEmailHandler from '../application/user/event/send-invitation-email.handler.js';
import SendPasswordResetEmailHandler from '../application/auth/event/send-password-reset-email.handler.js';

import LoginUseCase from '../application/auth/login/login.use-case.js';
import RefreshTokenUseCase from '../application/auth/refresh-token/refresh-token.use-case.js';
import LogoutUseCase from '../application/auth/logout/logout.use-case.js';
import LogoutAllDevicesUseCase from '../application/auth/logout-all-devices/logout-all-devices.use-case.js';
import RequestPasswordResetUseCase from '../application/auth/request-password-reset/request-password-reset.use-case.js';

import CreateUserUseCase from '../application/user/create-user/create-user.use-case.js';
import GetUserUseCase from '../application/user/get-user/get-user.use-case.js';
import ListUsersUseCase from '../application/user/list-users/list-users.use-case.js';
import UpdateUserUseCase from '../application/user/update-user/update-user.use-case.js';
import ActivateUserUseCase from '../application/user/activate-user/activate-user.use-case.js';
import DeactivateUserUseCase from '../application/user/deactivate-user/deactivate-user.use-case.js';
import DeleteUserUseCase from '../application/user/delete-user/delete-user.use-case.js';
import SetPasswordUseCase from '../application/user/set-password/set-password.use-case.js';
import AssignRolesToUserUseCase from '../application/user/assign-roles/assign-roles-to-user.use-case.js';
import RemoveRolesFromUserUseCase from '../application/user/remove-roles/remove-roles-from-user.use-case.js';

import CreateRoleUseCase from '../application/role/create-role/create-role.use-case.js';
import GetRoleUseCase from '../application/role/get-role/get-role.use-case.js';
import ListRolesUseCase from '../application/role/list-roles/list-roles.use-case.js';
import UpdateRoleUseCase from '../application/role/update-role/update-role.use-case.js';
import AssignPermissionsToRoleUseCase from '../application/role/assign-permissions/assign-permissions-to-role.use-case.js';
import DeleteRoleUseCase from '../application/role/delete-role/delete-role.use-case.js';

import CreatePermissionUseCase from '../application/permission/create-permission/create-permission.use-case.js';
import GetPermissionUseCase from '../application/permission/get-permission/get-permission.use-case.js';
import ListPermissionsUseCase from '../application/permission/list-permissions/list-permissions.use-case.js';
import UpdatePermissionUseCase from '../application/permission/update-permission/update-permission.use-case.js';
import DeletePermissionUseCase from '../application/permission/delete-permission/delete-permission.use-case.js';

import CreateClientApplicationUseCase from '../application/client-application/create-client-application/create-client-application.use-case.js';
import GetClientApplicationUseCase from '../application/client-application/get-client-application/get-client-application.use-case.js';
import ListClientApplicationsUseCase from '../application/client-application/list-client-applications/list-client-applications.use-case.js';
import UpdateClientApplicationUseCase from '../application/client-application/update-client-application/update-client-application.use-case.js';
import RotateClientSecretUseCase from '../application/client-application/rotate-client-secret/rotate-client-secret.use-case.js';
import AddRedirectUriUseCase from '../application/client-application/add-redirect-uri/add-redirect-uri.use-case.js';
import RemoveRedirectUriUseCase from '../application/client-application/remove-redirect-uri/remove-redirect-uri.use-case.js';
import ActivateClientApplicationUseCase from '../application/client-application/activate-client-application/activate-client-application.use-case.js';
import DeactivateClientApplicationUseCase from '../application/client-application/deactivate-client-application/deactivate-client-application.use-case.js';
import DeleteClientApplicationUseCase from '../application/client-application/delete-client-application/delete-client-application.use-case.js';

try {
  process.loadEnvFile();
} catch {
  console.warn('.env file not found, using process.env');
}

const userRepository = new UserRepository();
const roleRepository = new RoleRepository();
const permissionRepository = new PermissionRepository();
const clientApplicationRepository = new ClientApplicationRepository();
const passwordTokenRepository = new PasswordTokenRepository();
const refreshTokenRepository = new RefreshTokenRepository(redis);

const hasher = new BcryptHasher();
const tokenService = new JoseTokenService(loadJwtConfig());
const rateLimiter = new RedisRateLimiter(redis);
const mailer = new NodemailerMailer(loadMailerConfig());

const eventDispatcher = new EventDispatcher();
eventDispatcher.register(UserCreatedEvent.name, new SendInvitationEmailHandler(mailer));
eventDispatcher.register(
  PasswordResetRequestedEvent.name,
  new SendPasswordResetEmailHandler(mailer),
);

export const repositories = {
  user: userRepository,
  role: roleRepository,
  permission: permissionRepository,
  clientApplication: clientApplicationRepository,
};

export const useCases = {
  auth: {
    login: new LoginUseCase(
      userRepository,
      clientApplicationRepository,
      refreshTokenRepository,
      hasher,
      tokenService,
      rateLimiter,
    ),
    refreshToken: new RefreshTokenUseCase(
      refreshTokenRepository,
      userRepository,
      clientApplicationRepository,
      tokenService,
    ),
    logout: new LogoutUseCase(refreshTokenRepository),
    logoutAllDevices: new LogoutAllDevicesUseCase(refreshTokenRepository),
    requestPasswordReset: new RequestPasswordResetUseCase(
      userRepository,
      passwordTokenRepository,
      eventDispatcher,
      rateLimiter,
    ),
  },
  user: {
    createUser: new CreateUserUseCase(userRepository, passwordTokenRepository, eventDispatcher),
    getUser: new GetUserUseCase(userRepository),
    listUsers: new ListUsersUseCase(userRepository),
    updateUser: new UpdateUserUseCase(userRepository),
    activateUser: new ActivateUserUseCase(userRepository),
    deactivateUser: new DeactivateUserUseCase(userRepository),
    deleteUser: new DeleteUserUseCase(userRepository),
    setPassword: new SetPasswordUseCase(
      userRepository,
      passwordTokenRepository,
      refreshTokenRepository,
      hasher,
      rateLimiter,
    ),
    assignRolesToUser: new AssignRolesToUserUseCase(userRepository, roleRepository),
    removeRolesFromUser: new RemoveRolesFromUserUseCase(userRepository),
  },
  role: {
    createRole: new CreateRoleUseCase(
      roleRepository,
      permissionRepository,
      clientApplicationRepository,
    ),
    getRole: new GetRoleUseCase(roleRepository),
    listRoles: new ListRolesUseCase(roleRepository),
    updateRole: new UpdateRoleUseCase(roleRepository),
    assignPermissionsToRole: new AssignPermissionsToRoleUseCase(
      roleRepository,
      permissionRepository,
    ),
    deleteRole: new DeleteRoleUseCase(roleRepository),
  },
  permission: {
    createPermission: new CreatePermissionUseCase(
      permissionRepository,
      clientApplicationRepository,
    ),
    getPermission: new GetPermissionUseCase(permissionRepository),
    listPermissions: new ListPermissionsUseCase(permissionRepository),
    updatePermission: new UpdatePermissionUseCase(permissionRepository),
    deletePermission: new DeletePermissionUseCase(permissionRepository),
  },
  clientApplication: {
    createClientApplication: new CreateClientApplicationUseCase(
      clientApplicationRepository,
      hasher,
    ),
    getClientApplication: new GetClientApplicationUseCase(clientApplicationRepository),
    listClientApplications: new ListClientApplicationsUseCase(clientApplicationRepository),
    updateClientApplication: new UpdateClientApplicationUseCase(clientApplicationRepository),
    rotateClientSecret: new RotateClientSecretUseCase(clientApplicationRepository, hasher),
    addRedirectUri: new AddRedirectUriUseCase(clientApplicationRepository),
    removeRedirectUri: new RemoveRedirectUriUseCase(clientApplicationRepository),
    activateClientApplication: new ActivateClientApplicationUseCase(clientApplicationRepository),
    deactivateClientApplication: new DeactivateClientApplicationUseCase(
      clientApplicationRepository,
    ),
    deleteClientApplication: new DeleteClientApplicationUseCase(clientApplicationRepository),
  },
};

export { tokenService };
export type UseCases = typeof useCases;
