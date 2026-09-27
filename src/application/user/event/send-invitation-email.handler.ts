import type EventHandlerInterface from '../../../domain/@shared/event/event-handler.interface.js';
import type UserCreatedEvent from '../../../domain/user/event/user-created.event.js';
import type MailerInterface from '../../@shared/mailer.interface.js';

export default class SendInvitationEmailHandler implements EventHandlerInterface<UserCreatedEvent> {
  constructor(private readonly mailer: MailerInterface) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    const { email, invitationToken } = event.eventData;
    await this.mailer.sendInvitationEmail(email, invitationToken);
  }
}
