import { action, computed, makeObservable, observable } from 'mobx';
import { container, singleton } from 'tsyringe';

import { token as localStorageToken, KEY } from '@domain/app/infra/localStorage';
import NoteExplorer from '@domain/app/model/note/Explorer';
import MaterialExplorer from '@domain/app/model/material/Explorer';
import MemoList from '@domain/app/model/memo/List';
import { EntityTypes } from '@domain/app/model/entity';

export type ExplorerTypes = EntityTypes.Note | EntityTypes.Material | EntityTypes.Memo;

export enum ExtraPanelType {
  Star = 'star',
  Topic = 'topic',
}

@singleton()
export default class ExplorerManager {
  private readonly localStorage = container.resolve(localStorageToken);

  constructor() {
    makeObservable(this);
    this.currentExplorer.load();
  }

  private readonly explorers = {
    [EntityTypes.Note]: container.resolve(NoteExplorer),
    [EntityTypes.Material]: container.resolve(MaterialExplorer),
    [EntityTypes.Memo]: container.resolve(MemoList),
  } as const;

  @observable.ref
  public currentExplorerType = this.localStorage.get<ExplorerTypes>(KEY.EXPLORER.CURRENT_EXPLORER) || EntityTypes.Note;

  @observable
  public extraPanels: ExtraPanelType[] = this.localStorage.get<ExtraPanelType[]>(KEY.EXPLORER.EXTRA_PANELS) || [];

  @action.bound
  public pinExtraPanel(type: ExtraPanelType) {
    this.extraPanels.push(type);
    this.localStorage.set(KEY.EXPLORER.EXTRA_PANELS, this.extraPanels);
  }

  @computed
  public get currentExplorer() {
    return this.explorers[this.currentExplorerType];
  }

  @action.bound
  public switchTo(type: ExplorerTypes) {
    if (type === this.currentExplorerType) {
      return;
    }

    if (this.currentExplorer instanceof MemoList) {
      this.currentExplorer.reset();
    }

    this.localStorage.set(KEY.EXPLORER.CURRENT_EXPLORER, type);
    this.currentExplorerType = type;
    this.currentExplorer.load();
  }
}
