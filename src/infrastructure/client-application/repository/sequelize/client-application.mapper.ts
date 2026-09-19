import type ClientApplication from "../../../../domain/client-application/entity/client-application.js";

export default class ClientApplicationMapper {
    static toPersistence(entity: ClientApplication) {
        return {
            id: entity.id,
            name: entity.name,
            clientId: entity.clientId,
            clientSecretHash: entity.clientSecretHash,
            redirectUris: entity.redirectUris,
            active: entity.active
        };
    }
}