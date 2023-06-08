import uniqueId from 'lodash/uniqueId';
import { container } from 'tsyringe';
import { makeObservable, action, observable, autorun } from 'mobx';
import { Emitter, type EventMap } from 'strict-event-emitter';

import type Tile from 'model/workbench/Tile';
import type { EntityId, EntityTypes } from 'interface/entity';
import { token as remoteToken } from 'infra/remote';
import { token as localStorageToken } from 'infra/localStorage';

import { token as editorManagerToken } from './EditorManager';

interface Breadcrumb {
  title: string;
  id: string;
  icon?: string;
}

export type Breadcrumbs = Array<Breadcrumb & { siblings: Breadcrumb[] }>;

export enum Events {
  Destroyed = 'entityEditor.destroyed',
}

export interface CommonEditorEvents extends EventMap {
  [Events.Destroyed]: [];
}

export default abstract class EntityEditor<
  T = unknown,
  S = unknown,
  E extends CommonEditorEvents = CommonEditorEvents,
> extends Emitter<E> {
  protected remote = container.resolve(remoteToken);
  protected localStorage = container.resolve(localStorageToken);
  protected editorManager = container.resolve(editorManagerToken);
  readonly id = uniqueId('editor-');
  private readonly cancelAutoStateStorage: ReturnType<typeof autorun>;
  @observable entity?: T;
  @observable readonly state: S;

  constructor(public tile: Tile, readonly entityId: EntityId, initialState: S) {
    super();
    makeObservable(this);
    this.state = this.localStorage.get<S>(this.localStorageKey) || initialState;
    this.init();
    this.cancelAutoStateStorage = autorun(this.saveState);
  }

  private get localStorageKey() {
    return `ui.state.editor.${this.entityId}`;
  }

  private readonly saveState = () => {
    this.localStorage.set(this.localStorageKey, this.state);
  };

  destroy() {
    this.emit(Events.Destroyed);
    this.removeAllListeners();
    this.cancelAutoStateStorage();
  }

  @action
  protected load(entity: T) {
    if (this.entity) {
      throw new Error('can not reload entity');
    }

    this.entity = entity;
  }

  abstract readonly tabView: { title: string; icon: string | null };
  abstract readonly entityType: EntityTypes;
  abstract readonly breadcrumbs: Breadcrumbs;
  protected abstract init(): void;
}
