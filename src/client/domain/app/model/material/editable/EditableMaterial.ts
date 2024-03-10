import { computed, makeObservable, observable, runInAction } from 'mobx';

import { EntityTypes } from '@shared/domain/model/entity';
import type { EntityMaterialVO } from '@shared/domain/model/material';
import EditableEntity from '@domain/app/model/abstract/EditableEntity';
import eventBus, { Events, UpdateEvent } from '../eventBus';

export default abstract class EditableMaterial extends EditableEntity<Required<EntityMaterialVO>> {
  protected readonly entityType = EntityTypes.Material;

  constructor(materialId: EntityMaterialVO['id']) {
    super(materialId);
    eventBus.on(Events.Updated, this.refresh);
    makeObservable(this);
  }

  @observable
  public entity?: Required<EntityMaterialVO>;

  @observable.ref
  protected blob?: ArrayBuffer;

  private readonly refresh = async ({ trigger, id }: UpdateEvent) => {
    if (trigger === this || id !== this.entityLocator.entityId) {
      return;
    }
    this.load(true);
  };

  protected async load(noBlob?: true) {
    const [info, blob, path] = await Promise.all([
      this.remote.material.queryOne.query(this.entityLocator.entityId),
      noBlob ? null : this.remote.material.getBlob.query(this.entityLocator.entityId),
      this.remote.material.queryPath.query(this.entityLocator.entityId),
    ]);

    runInAction(() => {
      this.entity = info as Required<EntityMaterialVO>;
      this.path = path;

      if (blob) {
        this.blob = blob as ArrayBuffer;
      }
    });
  }

  @computed
  public get entityLocator() {
    return { ...super.entityLocator, mimeType: this.entity?.mimeType };
  }

  public destroy() {
    eventBus.off(Events.Updated, this.refresh);
  }
}

export const ANNOTATION_COLORS = [
  /* Yellow */ '#2596be',
  /* Red */ '#ef0005',
  /* Blue */ '#0008ef',
  /* Purple */ '#b000ef',
  /* Gray */ '#a2a2a2',
];
