import { v4 as uuid } from 'uuid';
import Permission from '../entity/permission.js';

export default class PermissionFactory {
    static create(name: string, resource: string, action: string, description?: string) {
        return new Permission(uuid(), name, resource, action, description);
    }

    static restore(id: string, name: string, resource: string, action: string, description?: string) {
        return new Permission(id, name, resource, action, description);
    }
}