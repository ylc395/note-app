import { container } from 'tsyringe';
import { makeObservable, observable, autorun } from 'mobx';
import uniqueId from 'lodash/uniqueId';
import { Emitter, type EventMap } from 'strict-event-emitter';

import { token as localStorageToken } from 'infra/localStorage';
import type EntityEditor from 'model/abstract/Editor';
import type Tile from 'model/workbench/Tile';

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
  protected localStorage = container.resolve(localStorageToken);
  @observable readonly state: S;
  private readonly cancelAutoStateStorage: ReturnType<typeof autorun>;
  constructor(public tile: Tile, public editor: T, initialState: S) {
    super();
    this.state = this.localStorage.get<S>(this.localStorageKey) || initialState;
    this.cancelAutoStateStorage = autorun(this.saveState);
    makeObservable(this);
  }

  private get localStorageKey() {
    return `ui.state.editor.${this.editor.entityType}.${this.editor.entityId}`;
  }

  private readonly saveState = () => {
    this.localStorage.set(this.localStorageKey, this.state);
  };

  get isActive(): boolean {
    return this.editor.activeView === this;
  }

  destroy() {
    this.cancelAutoStateStorage();
    this.emit(Events.Destroyed);
    this.removeAllListeners();
  }
}
