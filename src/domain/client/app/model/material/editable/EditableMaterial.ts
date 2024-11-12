import { computed, makeObservable, observable, runInAction } from 'mobx';
import assert from 'assert';

import { EntityTypes } from '#domain/shared/model/entity';
import type { EntityMaterialVO } from '#domain/shared/model/material';
import EditableEntity from '#domain/client/app/model/abstract/EditableEntity';
import type { AnnotationDTO, AnnotationPatchDTO, AnnotationVO } from '#domain/shared/model/annotation';
import { buildIndex } from '#utils/collection';
import eventBus, { Events, UpdateEvent } from '../eventBus';

export default abstract class EditableMaterial extends EditableEntity<Required<EntityMaterialVO>> {
  protected readonly entityType = EntityTypes.Material;

  @observable
  private annotationMap: Record<AnnotationVO['id'], AnnotationVO> = {};

  @computed
  public get annotations() {
    return Object.values(this.annotationMap);
  }

  constructor(materialId: EntityMaterialVO['id']) {
    super(materialId);
    eventBus.on(Events.Updated, this.refresh);
    makeObservable(this);
    this.loadAnnotations();
  }

  @observable
  public entity?: Required<EntityMaterialVO>;

  @observable.ref
  protected blob?: ArrayBuffer;

  private readonly refresh = async ({ trigger, entity: { id } }: UpdateEvent) => {
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

  private async loadAnnotations() {
    const annotations = await this.remote.annotation.queryByEntityId.query(this.entityId);

    runInAction(() => {
      this.annotationMap = buildIndex(annotations);
    });
  }

  public readonly getAnnotation = (id: AnnotationVO['id']) => {
    const annotation = this.annotationMap[id];
    assert(annotation);

    return annotation;
  };

  public readonly createAnnotation = async (
    annotation: Pick<AnnotationDTO, 'selectors' | 'color' | 'body' | 'targetText'>,
  ) => {
    const newAnnotation = await this.remote.annotation.create.mutate({
      targetId: this.entityId,
      ...annotation,
    });

    runInAction(() => {
      this.annotationMap[newAnnotation.id] = newAnnotation;
    });
  };

  public readonly updateAnnotation = async (id: AnnotationVO['id'], patch: AnnotationPatchDTO) => {
    const annotation = await this.remote.annotation.updateOne.mutate([id, patch]);

    runInAction(() => {
      this.annotationMap[id] = annotation;
    });
  };
}

export const ANNOTATION_COLORS = [
  /* Yellow */ '#2596be',
  /* Red */ '#ef0005',
  /* Blue */ '#0008ef',
  /* Purple */ '#b000ef',
  /* Gray */ '#a2a2a2',
];
