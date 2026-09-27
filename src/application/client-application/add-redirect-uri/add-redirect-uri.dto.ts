import type { ClientApplicationOutputDto } from '../@shared/client-application-output.dto.js';

export interface AddRedirectUriInputDto {
  clientApplicationId: string;
  redirectUri: string;
}

export type AddRedirectUriOutputDto = ClientApplicationOutputDto;
