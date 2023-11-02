import { container } from 'tsyringe';
import uniqueId from 'lodash/uniqueId';
import debounce from 'lodash/debounce';
import { action, makeObservable, observable } from 'mobx';
import { Emitter, type EventMap } from 'strict-event-emitter';

import { token as localStorageToken } from 'infra/localStorage';
import type EditableEntity from 'model/abstract/EditableEntity';
import type Tile from 'model/workbench/Tile';

interface Breadcrumb {
  title: string;
  id: string;
  icon?: string | null;
}

export type Breadcrumbs = Array<Breadcrumb & { siblings: Breadcrumb[] }>;

export enum Events {
  Destroyed = 'entityEditor.destroyed',
}

export interface CommonEditorEvents extends EventMap {
  [Events.Destroyed]: [];
}

export default abstract class Editor<
  T extends EditableEntity = EditableEntity,
  S = unknown,
> extends Emitter<CommonEditorEvents> {
  readonly id = uniqueId('editor-');
  abstract readonly tabView: { title: string; icon: string | null };
  abstract readonly breadcrumbs: Breadcrumbs;
  protected localStorage = container.resolve(localStorageToken);
  uiState: Partial<S> | null;
  constructor(public tile: Tile, public readonly editable: T) {
    super();
    this.uiState = this.localStorage.get<S>(this.localStorageKey);
    makeObservable(this);
  }

  private get localStorageKey() {
    return `ui.state.editor.${this.editable.entityType}.${this.editable.entityId}`;
  }

  destroy() {
    this.emit(Events.Destroyed);
    this.removeAllListeners();
  }

  @observable isFocused = false;

  @action.bound
  setBlur() {
    console.log(`blur ${this.id}`);
    this.isFocused = false;
  }

  @action.bound
  setFocus() {
    console.log(`focus ${this.id}`);

    this.isFocused = true;
  }

  updateUIState = debounce((state: Partial<S>) => {
    this.uiState = { ...this.uiState, ...state };
    this.localStorage.set(this.localStorageKey, this.uiState);
  }, 200);
}
