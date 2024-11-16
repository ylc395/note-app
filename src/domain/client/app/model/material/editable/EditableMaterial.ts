import { computed, observable, runInAction } from 'mobx';
import { keyBy } from 'lodash-es';

import { type EntityPath, EntityTypes } from '#domain/shared/model/entity';
import type { EntityMaterialVO, MaterialPatchDTO } from '#domain/shared/model/material';
import EditableEntity from '#domain/client/app/model/abstract/Editable';
import type { AnnotationDTO, AnnotationVO } from '#domain/shared/model/annotation';
import { eventBus, EventNames } from '../eventBus';

export default class EditableMaterial extends EditableEntity<EntityMaterialVO> {
  protected readonly entityType = EntityTypes.Material;
  constructor(materialId: EntityMaterialVO['id']) {
    super(materialId);
    this.loadAnnotations();
  }

  @observable private accessor annotationMap: Record<AnnotationVO['id'], AnnotationVO> = {};

  @computed
  public get annotations() {
    return Object.values(this.annotationMap);
  }

  @observable public accessor path: EntityPath | undefined;

  @observable public accessor entity: EntityMaterialVO | undefined;

  @observable.ref public accessor blob: ArrayBuffer | undefined;

  public async update(patch: MaterialPatchDTO) {
    await this.remote.material.updateOne.mutate([this.entityLocator.entityId, patch]);

    eventBus.emit(EventNames.Updated, {
      id: this.entityLocator.entityId,
      payload: patch,
      trigger: this,
    });
  }

  protected async _load(signal: AbortController['signal']) {
    const [info, blob, path] = await Promise.all([
      this.remote.material.queryOne.query(this.entityLocator.entityId, { signal }),
      this.blob ? null : this.remote.material.getBlob.query(this.entityLocator.entityId, { signal }),
      this.remote.material.queryPath.query(this.entityLocator.entityId, { signal }),
    ]);

    runInAction(() => {
      this.entity = info as EntityMaterialVO;
      this.path = path;

      if (blob) {
        this.blob = blob as ArrayBuffer;
      }
    });
  }

  public async loadAnnotations() {
    const annotations = await this.remote.annotation.queryByEntityId.query(this.entityLocator.entityId);

    runInAction(() => {
      this.annotationMap = keyBy(annotations, ({ id }) => id);
    });
  }

  public async createAnnotation(annotation: Pick<AnnotationDTO, 'selectors' | 'color' | 'body'>) {
    const newAnnotation = await this.remote.annotation.create.mutate({
      targetId: this.entityLocator.entityId,
      ...annotation,
    });

    runInAction(() => {
      this.annotationMap[newAnnotation.id] = newAnnotation;
    });
  }
}
