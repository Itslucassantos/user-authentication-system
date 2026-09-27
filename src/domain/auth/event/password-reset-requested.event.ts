import type EventInterface from '../../@shared/event/event.interface.js';

export default class PasswordResetRequestedEvent implements EventInterface {
  dataTimeOccurred: Date;
  eventData: { userId: string; email: string; resetToken: string };

  constructor(eventData: PasswordResetRequestedEvent['eventData']) {
    this.dataTimeOccurred = new Date();
    this.eventData = eventData;
  }
}
