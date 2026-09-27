import type { AuthPayloadOutputDto } from '../@shared/auth-payload-output.dto.js';

export interface LoginInputDto {
  email: string;
  password: string;
  clientId: string;
  deviceInfo: string;
}

export type LoginOutputDto = AuthPayloadOutputDto;
