import type EventDispatcherInterface from '../../domain/@shared/event/event-dispatcher.interface.js';
import type EventInterface from '../../domain/@shared/event/event.interface.js';

export default class FakeEventDispatcher implements EventDispatcherInterface {
  readonly events: EventInterface[] = [];

  async notify(event: EventInterface): Promise<void> {
    this.events.push(event);
  }

  register(): void {}

  unregister(): void {}

  unregisterAll(): void {}
}
