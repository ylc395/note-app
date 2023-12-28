import { action, computed, makeObservable, observable } from 'mobx';
import { container, singleton } from 'tsyringe';

import { token as localStorageToken } from '@domain/app/infra/localStorage';
import NoteExplorer from '@domain/app/model/note/Explorer';
import MaterialExplorer from '@domain/app/model/material/Explorer';
import { EntityTypes } from '@domain/app/model/entity';

const CURRENT_EXPLORER_KEY = 'EXPLORER_CURRENT';

export type ExplorerTypes = EntityTypes.Note | EntityTypes.Material;

@singleton()
export default class ExplorerManager {
  constructor() {
    makeObservable(this);
    this.switchTo(this.localStorage.get<ExplorerTypes>(CURRENT_EXPLORER_KEY) || EntityTypes.Note);
  }

  private readonly explorers = {
    [EntityTypes.Note]: container.resolve(NoteExplorer),
    [EntityTypes.Material]: container.resolve(MaterialExplorer),
  } as const;

  private readonly localStorage = container.resolve(localStorageToken);

  @observable.ref
  public currentExplorerType!: ExplorerTypes;

  @computed
  public get currentExplorer() {
    return this.explorers[this.currentExplorerType];
  }

  @action.bound
  public switchTo(type: ExplorerTypes) {
    this.localStorage.set(CURRENT_EXPLORER_KEY, type);
    this.currentExplorerType = type;
    this.currentExplorer.load();
  }
}
