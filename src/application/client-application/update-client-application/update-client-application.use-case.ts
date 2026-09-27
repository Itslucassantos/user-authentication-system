import ClientApplicationAlreadyExistsError from '../../../domain/client-application/error/client-application-already-exists-error.js';
import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import type ClientApplicationRepositoryInterface from '../../../domain/client-application/repository/client-application-repository.interface.js';
import { toClientApplicationOutputDto } from '../@shared/client-application-output.dto.js';
import type {
  UpdateClientApplicationInputDto,
  UpdateClientApplicationOutputDto,
} from './update-client-application.dto.js';

export default class UpdateClientApplicationUseCase {
  constructor(private readonly clientApplicationRepository: ClientApplicationRepositoryInterface) {}

  async execute(input: UpdateClientApplicationInputDto): Promise<UpdateClientApplicationOutputDto> {
    const { clientApplicationId, name } = input;

    const clientApplication = await this.clientApplicationRepository.findById(clientApplicationId);
    if (!clientApplication) throw new ClientApplicationNotFoundError(clientApplicationId);

    const existing = await this.clientApplicationRepository.findByName(name);
    if (existing && existing.id !== clientApplication.id) {
      throw new ClientApplicationAlreadyExistsError(name);
    }

    clientApplication.changeName(name);
    await this.clientApplicationRepository.update(clientApplication);

    return toClientApplicationOutputDto(clientApplication);
  }
}
