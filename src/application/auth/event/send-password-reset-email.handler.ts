import type EventHandlerInterface from '../../../domain/@shared/event/event-handler.interface.js';
import type PasswordResetRequestedEvent from '../../../domain/auth/event/password-reset-requested.event.js';
import type MailerInterface from '../../@shared/mailer.interface.js';

export default class SendPasswordResetEmailHandler implements EventHandlerInterface<PasswordResetRequestedEvent> {
  constructor(private readonly mailer: MailerInterface) {}

  async handle(event: PasswordResetRequestedEvent): Promise<void> {
    const { email, resetToken } = event.eventData;
    await this.mailer.sendPasswordResetEmail(email, resetToken);
  }
}
