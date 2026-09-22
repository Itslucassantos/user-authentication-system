import type EventInterface from './event.interface.js';

export default interface EventHandlerInterface<T extends EventInterface = EventInterface> {
  handle(event: T): Promise<void> | void;
}
