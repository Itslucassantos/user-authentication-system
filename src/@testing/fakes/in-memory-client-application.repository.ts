import type {
  PaginatedResult,
  PaginationParams,
} from '../../domain/@shared/repository/pagination.js';
import type ClientApplication from '../../domain/client-application/entity/client-application.js';
import ClientApplicationAlreadyExistsError from '../../domain/client-application/error/client-application-already-exists-error.js';
import ClientApplicationNotFoundError from '../../domain/client-application/error/client-application-not-found-error.js';
import ClientApplicationFactory from '../../domain/client-application/factory/client-application.factory.js';
import type ClientApplicationRepositoryInterface from '../../domain/client-application/repository/client-application-repository.interface.js';
import { paginate } from './paginate.js';

export default class InMemoryClientApplicationRepository implements ClientApplicationRepositoryInterface {
  private readonly clientApplications = new Map<string, ClientApplication>();

  seed(...clientApplications: ClientApplication[]): this {
    clientApplications.forEach((clientApplication) =>
      this.clientApplications.set(clientApplication.id, this.snapshot(clientApplication)),
    );
    return this;
  }

  all(): ClientApplication[] {
    return [...this.clientApplications.values()].map((app) => this.snapshot(app));
  }

  async findById(id: string): Promise<ClientApplication | null> {
    const clientApplication = this.clientApplications.get(id);
    return clientApplication ? this.snapshot(clientApplication) : null;
  }

  async findByName(name: string): Promise<ClientApplication | null> {
    return this.all().find((app) => app.name === name) ?? null;
  }

  async findByClientId(clientId: string): Promise<ClientApplication | null> {
    return this.all().find((app) => app.clientId === clientId) ?? null;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<ClientApplication>> {
    return paginate(this.all(), params);
  }

  async save(clientApplication: ClientApplication): Promise<void> {
    if (await this.findByName(clientApplication.name)) {
      throw new ClientApplicationAlreadyExistsError(clientApplication.name);
    }
    this.clientApplications.set(clientApplication.id, this.snapshot(clientApplication));
  }

  async update(clientApplication: ClientApplication): Promise<void> {
    if (!this.clientApplications.has(clientApplication.id)) {
      throw new ClientApplicationNotFoundError(clientApplication.id);
    }
    this.clientApplications.set(clientApplication.id, this.snapshot(clientApplication));
  }

  async delete(id: string): Promise<void> {
    if (!this.clientApplications.delete(id)) throw new ClientApplicationNotFoundError(id);
  }

  private snapshot(clientApplication: ClientApplication): ClientApplication {
    return ClientApplicationFactory.restore(
      clientApplication.id,
      clientApplication.name,
      clientApplication.clientId,
      clientApplication.clientSecretHash,
      [...clientApplication.redirectUris],
      clientApplication.active,
      [...clientApplication.roles],
    );
  }
}
