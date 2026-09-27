import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import type ClientApplicationRepositoryInterface from '../../../domain/client-application/repository/client-application-repository.interface.js';
import type { DeactivateClientApplicationInputDto } from './deactivate-client-application.dto.js';

export default class DeactivateClientApplicationUseCase {
  constructor(private readonly clientApplicationRepository: ClientApplicationRepositoryInterface) {}

  async execute(input: DeactivateClientApplicationInputDto): Promise<void> {
    const clientApplication = await this.clientApplicationRepository.findById(
      input.clientApplicationId,
    );
    if (!clientApplication) throw new ClientApplicationNotFoundError(input.clientApplicationId);

    clientApplication.deactivate();
    await this.clientApplicationRepository.update(clientApplication);
  }
}
