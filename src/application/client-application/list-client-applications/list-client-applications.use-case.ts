import type ClientApplicationRepositoryInterface from '../../../domain/client-application/repository/client-application-repository.interface.js';
import { toClientApplicationOutputDto } from '../@shared/client-application-output.dto.js';
import type {
  ListClientApplicationsInputDto,
  ListClientApplicationsOutputDto,
} from './list-client-applications.dto.js';

export default class ListClientApplicationsUseCase {
  constructor(private readonly clientApplicationRepository: ClientApplicationRepositoryInterface) {}

  async execute(input: ListClientApplicationsInputDto): Promise<ListClientApplicationsOutputDto> {
    const { page, limit } = input;

    const result = await this.clientApplicationRepository.findAll({ page, limit });

    return {
      items: result.items.map((clientApplication) =>
        toClientApplicationOutputDto(clientApplication),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
