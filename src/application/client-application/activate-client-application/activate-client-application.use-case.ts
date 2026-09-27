import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import type ClientApplicationRepositoryInterface from '../../../domain/client-application/repository/client-application-repository.interface.js';
import type { ActivateClientApplicationInputDto } from './activate-client-application.dto.js';

export default class ActivateClientApplicationUseCase {
  constructor(private readonly clientApplicationRepository: ClientApplicationRepositoryInterface) {}

  async execute(input: ActivateClientApplicationInputDto): Promise<void> {
    const clientApplication = await this.clientApplicationRepository.findById(
      input.clientApplicationId,
    );
    if (!clientApplication) throw new ClientApplicationNotFoundError(input.clientApplicationId);

    clientApplication.activate();
    await this.clientApplicationRepository.update(clientApplication);
  }
}
