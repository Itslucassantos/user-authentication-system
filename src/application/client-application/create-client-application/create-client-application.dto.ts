import type { ClientApplicationCreatedOutputDto } from '../@shared/client-application-output.dto.js';

export interface CreateClientApplicationInputDto {
  name: string;
  redirectUris: string[];
}

export type CreateClientApplicationOutputDto = ClientApplicationCreatedOutputDto;
