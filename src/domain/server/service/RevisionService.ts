import { container, singleton } from 'tsyringe';
import assert from 'node:assert';
import { filter, fromEvent, groupBy, merge, mergeMap, throttleTime } from 'rxjs';

import EventService from './EventService.js';
import BaseService from './BaseService.js';
import { EventNames } from '../model/entity.js';
import { Event } from '../model/event.js';
import { getBody, getTitle } from '../model/content.js';

@singleton()
export default class RevisionService extends BaseService {
  private readonly event = container.resolve(EventService);
  private readonly duration = 10 * 60 * 1000;

  constructor() {
    super();

    merge(fromEvent(this.event, EventNames.Created), fromEvent(this.event, EventNames.Updated))
      .pipe(
        filter((e: Event) => typeof getTitle(e.payload) === 'string' || typeof getBody(e.payload) === 'string'),
        groupBy((e: Event) => e.entityLocator!.entityId),
        mergeMap(($e) => $e.pipe(throttleTime(this.duration))),
      )
      .subscribe(this.create.bind(this));
  }

  private async create({ entityLocator, payload }: Event) {}
}
