import { uniqueId } from 'lodash-es';
import { computed, observable } from 'mobx';

import EventBus from '#domain/client/app/infra/EventBus';

import type Editable from '../Editable';
import type Tile from '../../workbench/Tile';
import SearchBox from './SearchBox';
import { type EventsMap, EventNames } from './events';
import UIState from './UIState';

export { EventNames } from './events';

export default class Editor<E extends Editable<unknown> = Editable<unknown>, S = unknown> extends EventBus<EventsMap> {
  public readonly searchBox = new SearchBox();
  public readonly uiState = new UIState<S>(this.entityLocator.entityId);

  constructor(protected readonly editable: E, tile: Tile) {
    super('editor');
    this.tile = tile;
  }

  public readonly id = uniqueId('editor-');

  @observable.ref public accessor tile: Tile;

  public destroy() {
    this.emit(EventNames.Destroy);
    this.clearListeners();
  }

  public get entityLocator() {
    return this.editable.entityLocator;
  }

  @computed
  public get entity() {
    return this.editable.entity;
  }
}
