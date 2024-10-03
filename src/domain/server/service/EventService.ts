import { singleton } from 'tsyringe';
import Emittery from 'emittery';

import { IS_DEV } from '@domain/shared/infra/constants.js';
import BaseService from './BaseService.js';
import type { Event } from '../model/event.js';
import { arrayOf, type MaybeArray } from '@utils/collection.js';

@singleton()
export default class EventService extends BaseService {
  private readonly deviceName = this.runtime.getDeviceName();
  private readonly eventEmitter = new Emittery({
    debug: {
      name: 'EventService',
      enabled: true,
      logger: (type, debugName, eventName, data) => {
        if (IS_DEV) {
          console.log(`${debugName} [${String(eventName)}]: ${JSON.stringify(data)}`);
        }
      },
    },
  });

  public async create<T>(
    event: MaybeArray<Pick<Event<T>, 'type' | 'entityLocator' | 'payload'>>,
    toPersist?: (payload: Event<T>['payload']) => unknown,
  ) {
    const events = arrayOf(event).map((e) => ({
      ...e,
      payload: toPersist ? toPersist(e.payload) : e.payload,
      time: Date.now(),
      deviceName: this.deviceName,
    }));

    await this.repo.events.create(events);

    for (const e of arrayOf(event)) {
      this.eventEmitter.emit(e.type, e);
    }
  }

  public readonly on = this.eventEmitter.on.bind(this.eventEmitter);
  public readonly off = this.eventEmitter.off.bind(this.eventEmitter);
}
