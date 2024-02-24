import { action, computed, makeObservable, observable } from 'mobx';
import { container, singleton } from 'tsyringe';

import { token as localStorageToken, KEY } from '@domain/app/infra/localStorage';
import NoteExplorer from '@domain/app/model/note/Explorer';
import MaterialExplorer from '@domain/app/model/material/Explorer';
import MemoList from '@domain/app/model/memo/List';
import { EntityTypes } from '@domain/app/model/entity';
import StarManager, { Events, type ToggleEvent } from './StarManager';

export type ExplorerTypes = EntityTypes.Note | EntityTypes.Material | EntityTypes.Memo;

export enum ExtraPanelType {
  Star = 'star',
  Topic = 'topic',
}

@singleton()
export default class ExplorerManager {
  private readonly localStorage = container.resolve(localStorageToken);
  private readonly starManager = container.resolve(StarManager);

  constructor() {
    makeObservable(this);
    this.currentExplorer.load();
    this.starManager.on(Events.StarToggle, this.handleStarToggle);
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

    this.localStorage.set(KEY.EXPLORER.CURRENT_EXPLORER, type);
    this.currentExplorerType = type;
    this.currentExplorer.load();
  }

  private readonly handleStarToggle = (e: ToggleEvent) => {
    const explorers = Object.values(this.explorers);

    for (const explorer of explorers) {
      explorer.handleEntityUpdate({ ...e, trigger: this.starManager });
    }
  };
}
