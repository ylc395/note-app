import { action, computed, makeObservable, observable } from 'mobx';
import { container, singleton } from 'tsyringe';
import assert from 'assert';

import { token as localStorageToken, KEY } from '@domain/app/infra/localStorage';
import NoteExplorer from '@domain/app/model/note/Explorer';
import MaterialExplorer from '@domain/app/model/material/Explorer';
import MemoExplorer from '@domain/app/model/memo/Explorer';
import { EntityLocator, EntityTypes } from '@domain/app/model/entity';

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
    this.currentExplorer.init();
  }

  private readonly explorers = {
    [EntityTypes.Note]: container.resolve(NoteExplorer),
    [EntityTypes.Material]: container.resolve(MaterialExplorer),
    [EntityTypes.Memo]: container.resolve(MemoExplorer),
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

  public get(type: ExplorerTypes) {
    return this.explorers[type];
  }

  @action.bound
  public switchTo(type: ExplorerTypes) {
    if (type === this.currentExplorerType) {
      return;
    }

    this.localStorage.set(KEY.EXPLORER.CURRENT_EXPLORER, type);
    this.currentExplorerType = type;
    this.currentExplorer.init();
  }

  public reveal({ entityId, entityType }: EntityLocator) {
    assert(entityType !== EntityTypes.Annotation, 'can not reveal');
    this.switchTo(entityType);
    this.currentExplorer.reveal(entityId, { expand: true, select: true });
  }
}
