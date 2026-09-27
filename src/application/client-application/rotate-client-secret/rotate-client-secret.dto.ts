import type { ClientApplicationCreatedOutputDto } from '../@shared/client-application-output.dto.js';

export interface RotateClientSecretInputDto {
  clientApplicationId: string;
}

export type RotateClientSecretOutputDto = ClientApplicationCreatedOutputDto;
