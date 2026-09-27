import type { ClientApplicationOutputDto } from '../@shared/client-application-output.dto.js';

export interface UpdateClientApplicationInputDto {
  clientApplicationId: string;
  name: string;
}

export type UpdateClientApplicationOutputDto = ClientApplicationOutputDto;
