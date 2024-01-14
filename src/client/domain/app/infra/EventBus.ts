import Emitter, { type EventName, type OmnipresentEventData } from 'emittery';

type Events = Record<EventName, unknown>;

export default class EventBus<T extends Events> extends Emitter<T> {
  constructor(name: string) {
    super({
      debug: {
        name,
        enabled: true,
        // todo: add custom logger for production
        logger: (type, debugName, eventName, eventData) => {
          console.log(`[eventBus ${debugName}]: ${type} ${String(eventName)}`, eventData);
        },
      },
    });
  }

  public on<E extends keyof (T & OmnipresentEventData)>(
    name: E | E[],
    cb: (e: (T & OmnipresentEventData)[E]) => void | Promise<void>,
    filter?: (e: T[E]) => boolean,
  ) {
    return super.on(
      name,
      !filter
        ? cb
        : (e) => {
            if (filter(e)) {
              return cb(e);
            }
          },
    );
  }
}
