import { v4 as uuid } from 'uuid';
import ClientApplication from '../entity/client-application.js';
import type Role from '../../role/entity/role.js';

export default class ClientApplicationFactory {
    static create(name: string, clientId: string, clientSecretHash: string, redirectUris: string[], roles?: Role[]): ClientApplication {
        return new ClientApplication(uuid(), name, clientId, clientSecretHash, redirectUris, roles);
    }

    static restore(id: string, name: string, clientId: string, clientSecretHash: string, redirectUris: string[], roles?: Role[]): ClientApplication {
        return new ClientApplication(id, name, clientId, clientSecretHash, redirectUris, roles);
    }
}
