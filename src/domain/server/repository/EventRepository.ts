import { Event, EventQuery } from '../model/event.js';

export interface EventRepository {
  create: (e: Required<Event> | Required<Event>[]) => Promise<void>;
  findAll: (q: EventQuery) => Promise<Required<Event>>;
}
