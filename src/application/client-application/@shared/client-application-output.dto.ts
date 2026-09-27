import type ClientApplication from '../../../domain/client-application/entity/client-application.js';

export interface ClientApplicationOutputDto {
  id: string;
  name: string;
  clientId: string;
  redirectUris: string[];
  active: boolean;
}

export function toClientApplicationOutputDto(
  clientApplication: ClientApplication,
): ClientApplicationOutputDto {
  return {
    id: clientApplication.id,
    name: clientApplication.name,
    clientId: clientApplication.clientId,
    redirectUris: [...clientApplication.redirectUris],
    active: clientApplication.active,
  };
}

export interface ClientApplicationCreatedOutputDto {
  clientApplication: ClientApplicationOutputDto;
  clientSecret: string;
}
