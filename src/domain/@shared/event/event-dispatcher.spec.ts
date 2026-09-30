import type EventHandlerInterface from './event-handler.interface.js';
import type EventInterface from './event.interface.js';
import EventDispatcher from './event-dispatcher.js';

class SomethingHappenedEvent implements EventInterface {
  dataTimeOccurred = new Date();
  eventData = { id: 1 };
}

class OtherThingHappenedEvent implements EventInterface {
  dataTimeOccurred = new Date();
  eventData = {};
}

const makeHandler = (): jest.Mocked<EventHandlerInterface> => ({ handle: jest.fn() });

describe('EventDispatcher', () => {
  it('notifies every handler registered for the event, in registration order', async () => {
    const dispatcher = new EventDispatcher();
    const calls: string[] = [];
    const first: EventHandlerInterface = { handle: () => void calls.push('first') };
    const second: EventHandlerInterface = { handle: () => void calls.push('second') };
    dispatcher.register('SomethingHappenedEvent', first);
    dispatcher.register('SomethingHappenedEvent', second);
    const event = new SomethingHappenedEvent();

    await dispatcher.notify(event);

    expect(calls).toEqual(['first', 'second']);
  });

  it('passes the event to the handler', async () => {
    const dispatcher = new EventDispatcher();
    const handler = makeHandler();
    dispatcher.register('SomethingHappenedEvent', handler);
    const event = new SomethingHappenedEvent();

    await dispatcher.notify(event);

    expect(handler.handle).toHaveBeenCalledWith(event);
  });

  it('does not notify handlers registered for other events', async () => {
    const dispatcher = new EventDispatcher();
    const handler = makeHandler();
    dispatcher.register('OtherThingHappenedEvent', handler);

    await dispatcher.notify(new SomethingHappenedEvent());

    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('ignores events that have no handlers', async () => {
    await expect(
      new EventDispatcher().notify(new SomethingHappenedEvent()),
    ).resolves.toBeUndefined();
  });

  it('waits for asynchronous handlers and propagates their failures', async () => {
    const dispatcher = new EventDispatcher();
    dispatcher.register('SomethingHappenedEvent', {
      handle: () => Promise.reject(new Error('handler failed')),
    });

    await expect(dispatcher.notify(new SomethingHappenedEvent())).rejects.toThrow('handler failed');
  });

  it('unregister removes only the given handler', async () => {
    const dispatcher = new EventDispatcher();
    const removed = makeHandler();
    const kept = makeHandler();
    dispatcher.register('SomethingHappenedEvent', removed);
    dispatcher.register('SomethingHappenedEvent', kept);

    dispatcher.unregister('SomethingHappenedEvent', removed);
    await dispatcher.notify(new SomethingHappenedEvent());

    expect(removed.handle).not.toHaveBeenCalled();
    expect(kept.handle).toHaveBeenCalledTimes(1);
  });

  it('unregister is a no-op for unknown events and handlers', () => {
    const dispatcher = new EventDispatcher();
    dispatcher.register('SomethingHappenedEvent', makeHandler());

    dispatcher.unregister('Unknown', makeHandler());
    dispatcher.unregister('SomethingHappenedEvent', makeHandler());

    expect(dispatcher.getEventHandlers['SomethingHappenedEvent']).toHaveLength(1);
  });

  it('unregisterAll clears every handler', async () => {
    const dispatcher = new EventDispatcher();
    const handler = makeHandler();
    dispatcher.register('SomethingHappenedEvent', handler);

    dispatcher.unregisterAll();
    await dispatcher.notify(new SomethingHappenedEvent());

    expect(handler.handle).not.toHaveBeenCalled();
    expect(dispatcher.getEventHandlers).toEqual({});
  });
});
