import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import type ClientApplicationRepositoryInterface from '../../../domain/client-application/repository/client-application-repository.interface.js';
import { toClientApplicationOutputDto } from '../@shared/client-application-output.dto.js';
import type { AddRedirectUriInputDto, AddRedirectUriOutputDto } from './add-redirect-uri.dto.js';

export default class AddRedirectUriUseCase {
  constructor(private readonly clientApplicationRepository: ClientApplicationRepositoryInterface) {}

  async execute(input: AddRedirectUriInputDto): Promise<AddRedirectUriOutputDto> {
    const { clientApplicationId, redirectUri } = input;

    const clientApplication = await this.clientApplicationRepository.findById(clientApplicationId);
    if (!clientApplication) throw new ClientApplicationNotFoundError(clientApplicationId);

    clientApplication.addRedirectUri(redirectUri);
    await this.clientApplicationRepository.update(clientApplication);

    return toClientApplicationOutputDto(clientApplication);
  }
}
