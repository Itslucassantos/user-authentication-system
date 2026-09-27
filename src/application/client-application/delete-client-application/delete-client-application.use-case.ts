import type ClientApplicationRepositoryInterface from '../../../domain/client-application/repository/client-application-repository.interface.js';
import type { DeleteClientApplicationInputDto } from './delete-client-application.dto.js';

export default class DeleteClientApplicationUseCase {
  constructor(private readonly clientApplicationRepository: ClientApplicationRepositoryInterface) {}

  async execute(input: DeleteClientApplicationInputDto): Promise<void> {
    await this.clientApplicationRepository.delete(input.clientApplicationId);
  }
}
