import Emitter from 'emittery';
import type { ContentUpdatedEvent } from '@domain/model/content.js';

type EventMaps = {
  contentUpdated: ContentUpdatedEvent;
};

const eventBus = new Emitter<EventMaps>();

export default eventBus;
