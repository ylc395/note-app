import { action, computed, observable } from 'mobx';
import assert from 'assert';

import NoteExplorer from '#domain/client/app/model/note/Explorer';
import MaterialExplorer from '#domain/client/app/model/material/Explorer';
import ListView from '#domain/client/app/model/memo/ListView';
import { EntityTypes, type EntityLocator } from '#domain/client/shared/model/entity';
import { container } from '#domain/shared/infra/singletons';
import { create as createUIState, type ExplorerTypes } from './uiState';

export default class ExplorerManager {
  constructor() {
    this.switchTo(this.uiState.value?.type || EntityTypes.Note);
  }

  private readonly uiState = createUIState();

  @observable private accessor currentExplorerType!: ExplorerTypes;

  private readonly explorers = {
    [EntityTypes.Note]: container.resolve(NoteExplorer),
    [EntityTypes.Material]: container.resolve(MaterialExplorer),
    [EntityTypes.Memo]: container.resolve(ListView),
  } as const;

  @computed
  public get currentExplorer() {
    return this.explorers[this.currentExplorerType];
  }

  public get all() {
    return Object.values(this.explorers);
  }

  @action.bound
  public switchTo(type: ExplorerTypes) {
    if (type === this.currentExplorerType) {
      return;
    }

    this.currentExplorerType = type;
    this.currentExplorer.init();
    this.uiState.update({ type });
  }

  public reveal({ entityId, entityType }: EntityLocator) {
    assert(entityType !== EntityTypes.Annotation, 'can not reveal');

    this.switchTo(entityType);
    this.currentExplorer.reveal(entityId);
  }
}
