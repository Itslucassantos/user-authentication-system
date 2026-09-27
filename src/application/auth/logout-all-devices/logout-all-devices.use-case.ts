import type RefreshTokenRepositoryInterface from '../../../domain/auth/repository/refresh-token-repository.interface.js';
import type { LogoutAllDevicesInputDto } from './logout-all-devices.dto.js';

export default class LogoutAllDevicesUseCase {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepositoryInterface) {}

  async execute(input: LogoutAllDevicesInputDto): Promise<void> {
    await this.refreshTokenRepository.deleteAllByUserId(input.userId);
  }
}
