import type ClientApplicationRepositoryInterface from '../../../domain/client-application/repository/client-application-repository.interface.js';
import { toClientApplicationOutputDto } from '../@shared/client-application-output.dto.js';
import type {
  GetClientApplicationInputDto,
  GetClientApplicationOutputDto,
} from './get-client-application.dto.js';

export default class GetClientApplicationUseCase {
  constructor(private readonly clientApplicationRepository: ClientApplicationRepositoryInterface) {}

  async execute(
    input: GetClientApplicationInputDto,
  ): Promise<GetClientApplicationOutputDto | null> {
    const clientApplication = await this.clientApplicationRepository.findById(
      input.clientApplicationId,
    );
    if (!clientApplication) return null;

    return toClientApplicationOutputDto(clientApplication);
  }
}
