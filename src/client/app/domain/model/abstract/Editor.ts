import uniqueId from 'lodash/uniqueId';
import { action, makeObservable, observable } from 'mobx';
import { Emitter } from 'strict-event-emitter';

import type EditableEntity from 'model/abstract/EditableEntity';
import type Tile from 'model/workbench/Tile';

// interface Breadcrumb {
//   title: string;
//   id: string;
//   icon?: string | null;
// }

// type Breadcrumbs = Array<Breadcrumb & { siblings: Breadcrumb[] }>;

type Events<S> = {
  destroyed: [];
  uiUpdated: [Partial<S>];
  focus: [];
};

export default abstract class Editor<T extends EditableEntity = EditableEntity, S = unknown> extends Emitter<
  Events<S>
> {
  readonly id = uniqueId('editor-');
  abstract readonly tabView: { title: string; icon: string | null };
  // abstract readonly breadcrumbs: Breadcrumbs;
  @observable isFocused = false;
  uiState: Partial<S> | null = null;

  constructor(protected readonly editable: T, public tile: Tile) {
    super();
    makeObservable(this);
  }
  toEntityLocator() {
    return this.editable.toEntityLocator();
  }

  destroy() {
    this.emit('destroyed');
    this.removeAllListeners();
  }

  @action.bound
  blur() {
    console.log(`blur ${this.id}`);
    this.isFocused = false;
  }

  @action.bound
  focus() {
    console.log(`focus ${this.id}`);
    this.emit('focus');
    this.isFocused = true;
  }

  @action
  updateUIState(state: Partial<S>) {
    this.uiState = { ...this.uiState, ...state };
    this.emit('uiUpdated', state);
  }
}
