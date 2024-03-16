import Emitter from 'emittery';
import type { EventMaps as ContentEvents } from '@domain/model/content.js';

type EventMaps = ContentEvents;

const eventBus = new Emitter<EventMaps>();

export default eventBus;
