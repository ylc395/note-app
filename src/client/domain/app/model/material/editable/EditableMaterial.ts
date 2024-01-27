import { computed, makeObservable, observable, runInAction } from 'mobx';

import { EntityTypes } from '@shared/domain/model/entity';
import type { EntityMaterialVO } from '@shared/domain/model/material';
import EditableEntity from '@domain/app/model/abstract/EditableEntity';
import eventBus, { Events } from '../eventBus';

export default abstract class EditableMaterial extends EditableEntity<Required<EntityMaterialVO>> {
  protected readonly entityType = EntityTypes.Material;

  constructor(materialId: EntityMaterialVO['id']) {
    super(materialId);
    eventBus.on(Events.Updated, this.refresh, ({ actor, id }) => actor !== this && id === materialId);
    makeObservable(this);
  }

  @observable
  public info?: Required<EntityMaterialVO>;

  @observable.ref
  protected blob?: ArrayBuffer;

  private readonly refresh = async () => {
    const info = await this.remote.material.queryOne.query(this.entityLocator.entityId);

    runInAction(() => {
      this.info = info as Required<EntityMaterialVO>;
    });
  };

  protected async load() {
    const [info, blob] = await Promise.all([
      this.remote.material.queryOne.query(this.entityLocator.entityId),
      this.remote.material.getBlob.query(this.entityLocator.entityId),
    ]);

    runInAction(() => {
      this.info = info as Required<EntityMaterialVO>;
      this.blob = blob as ArrayBuffer;
    });
  }

  @computed
  public get entityLocator() {
    return { ...super.entityLocator, mimeType: this.info?.mimeType };
  }
}

export const ANNOTATION_COLORS = [
  /* Yellow */ '#2596be',
  /* Red */ '#ef0005',
  /* Blue */ '#0008ef',
  /* Purple */ '#b000ef',
  /* Gray */ '#a2a2a2',
];
