import type { ClientApplicationOutputDto } from '../@shared/client-application-output.dto.js';

export interface ListClientApplicationsInputDto {
  page: number;
  limit: number;
}

export interface ListClientApplicationsOutputDto {
  items: ClientApplicationOutputDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
