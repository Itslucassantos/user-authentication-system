import { v4 as uuid } from 'uuid';
import ClientApplicationAlreadyExistsError from '../../../domain/client-application/error/client-application-already-exists-error.js';
import ClientApplicationFactory from '../../../domain/client-application/factory/client-application.factory.js';
import type ClientApplicationRepositoryInterface from '../../../domain/client-application/repository/client-application-repository.interface.js';
import type HasherInterface from '../../@shared/hasher.interface.js';
import { generateOpaqueToken } from '../../@shared/opaque-token.js';
import { toClientApplicationOutputDto } from '../@shared/client-application-output.dto.js';
import type {
  CreateClientApplicationInputDto,
  CreateClientApplicationOutputDto,
} from './create-client-application.dto.js';

export default class CreateClientApplicationUseCase {
  constructor(
    private readonly clientApplicationRepository: ClientApplicationRepositoryInterface,
    private readonly hasher: HasherInterface,
  ) {}

  async execute(input: CreateClientApplicationInputDto): Promise<CreateClientApplicationOutputDto> {
    const existing = await this.clientApplicationRepository.findByName(input.name);
    if (existing) throw new ClientApplicationAlreadyExistsError(input.name);

    const clientSecret = generateOpaqueToken();
    const clientSecretHash = await this.hasher.hash(clientSecret);

    const clientApplication = ClientApplicationFactory.create(
      input.name,
      uuid(),
      clientSecretHash,
      input.redirectUris,
    );

    await this.clientApplicationRepository.save(clientApplication);

    return {
      clientApplication: toClientApplicationOutputDto(clientApplication),
      clientSecret,
    };
  }
}
