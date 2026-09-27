import type { ClientApplicationOutputDto } from '../@shared/client-application-output.dto.js';

export interface GetClientApplicationInputDto {
  clientApplicationId: string;
}

export type GetClientApplicationOutputDto = ClientApplicationOutputDto;
