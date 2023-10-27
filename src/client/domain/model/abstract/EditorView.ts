import { container } from 'tsyringe';
import uniqueId from 'lodash/uniqueId';
import debounce from 'lodash/debounce';
import { Emitter, type EventMap } from 'strict-event-emitter';

import { token as localStorageToken } from 'infra/localStorage';
import type EntityEditor from 'model/abstract/Editor';
import type Tile from 'model/workbench/Tile';

interface Breadcrumb {
  title: string;
  id: string;
  icon?: string | null;
}

export type Breadcrumbs = Array<Breadcrumb & { siblings: Breadcrumb[] }>;

export enum Events {
  Destroyed = 'entityEditorView.destroyed',
}

export interface CommonEditorViewEvents extends EventMap {
  [Events.Destroyed]: [];
}

export default abstract class EditorView<
  T extends EntityEditor = EntityEditor,
  S = unknown,
> extends Emitter<CommonEditorViewEvents> {
  readonly id = uniqueId('editorView-');
  abstract readonly tabView: { title: string; icon: string | null };
  abstract readonly breadcrumbs: Breadcrumbs;
  protected localStorage = container.resolve(localStorageToken);
  uiState: S;
  constructor(public tile: Tile, public readonly editor: T, initialState: S) {
    super();
    this.uiState = this.localStorage.get<S>(this.localStorageKey) || initialState;
  }

  private get localStorageKey() {
    return `ui.state.editor.${this.editor.entityType}.${this.editor.entityId}`;
  }

  destroy() {
    this.emit(Events.Destroyed);
    this.removeAllListeners();
  }

  updateUIState = debounce((state: Partial<S>) => {
    this.uiState = { ...this.uiState, ...state };
    this.localStorage.set(this.localStorageKey, this.uiState);
  }, 200);
}
