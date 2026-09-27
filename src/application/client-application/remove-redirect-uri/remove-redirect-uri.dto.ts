import type { ClientApplicationOutputDto } from '../@shared/client-application-output.dto.js';

export interface RemoveRedirectUriInputDto {
  clientApplicationId: string;
  redirectUri: string;
}

export type RemoveRedirectUriOutputDto = ClientApplicationOutputDto;
