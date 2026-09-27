import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import type ClientApplicationRepositoryInterface from '../../../domain/client-application/repository/client-application-repository.interface.js';
import type HasherInterface from '../../@shared/hasher.interface.js';
import { generateOpaqueToken } from '../../@shared/opaque-token.js';
import { toClientApplicationOutputDto } from '../@shared/client-application-output.dto.js';
import type {
  RotateClientSecretInputDto,
  RotateClientSecretOutputDto,
} from './rotate-client-secret.dto.js';

export default class RotateClientSecretUseCase {
  constructor(
    private readonly clientApplicationRepository: ClientApplicationRepositoryInterface,
    private readonly hasher: HasherInterface,
  ) {}

  async execute(input: RotateClientSecretInputDto): Promise<RotateClientSecretOutputDto> {
    const { clientApplicationId } = input;

    const clientApplication = await this.clientApplicationRepository.findById(clientApplicationId);
    if (!clientApplication) throw new ClientApplicationNotFoundError(clientApplicationId);

    const clientSecret = generateOpaqueToken();
    clientApplication.rotateClientSecret(await this.hasher.hash(clientSecret));
    await this.clientApplicationRepository.update(clientApplication);

    return {
      clientApplication: toClientApplicationOutputDto(clientApplication),
      clientSecret,
    };
  }
}
