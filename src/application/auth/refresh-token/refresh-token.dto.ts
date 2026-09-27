import type { AuthPayloadOutputDto } from '../@shared/auth-payload-output.dto.js';

export interface RefreshTokenInputDto {
  refreshToken: string;
}

export type RefreshTokenOutputDto = AuthPayloadOutputDto;
