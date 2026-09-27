import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import type ClientApplicationRepositoryInterface from '../../../domain/client-application/repository/client-application-repository.interface.js';
import { toClientApplicationOutputDto } from '../@shared/client-application-output.dto.js';
import type {
  RemoveRedirectUriInputDto,
  RemoveRedirectUriOutputDto,
} from './remove-redirect-uri.dto.js';

export default class RemoveRedirectUriUseCase {
  constructor(private readonly clientApplicationRepository: ClientApplicationRepositoryInterface) {}

  async execute(input: RemoveRedirectUriInputDto): Promise<RemoveRedirectUriOutputDto> {
    const { clientApplicationId, redirectUri } = input;

    const clientApplication = await this.clientApplicationRepository.findById(clientApplicationId);
    if (!clientApplication) throw new ClientApplicationNotFoundError(clientApplicationId);

    clientApplication.removeRedirectUri(redirectUri);
    await this.clientApplicationRepository.update(clientApplication);

    return toClientApplicationOutputDto(clientApplication);
  }
}
