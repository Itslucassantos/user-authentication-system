import type EventInterface from '../../@shared/event/event.interface.js';

export default class UserCreatedEvent implements EventInterface {
  dataTimeOccurred: Date;
  eventData: { userId: string; name: string; email: string; invitationToken: string };

  constructor(eventData: UserCreatedEvent['eventData']) {
    this.dataTimeOccurred = new Date();
    this.eventData = eventData;
  }
}
