import { container } from 'tsyringe';
import assert from 'assert';
import { observable, makeObservable, computed } from 'mobx';

import { token as rpcToken } from '@domain/common/infra/rpc';
import { EntityId, EntityLocator, EntityTypes, Path } from '../entity';
import type { Tile } from '../workbench';
import type Editor from './Editor';
import type { AnnotationDTO, AnnotationPatchDTO, AnnotationVO } from '@shared/domain/model/annotation';
import { runInAction } from 'mobx';
import { buildIndex } from '@shared/utils/collection';

export interface EditableEntityLocator extends EntityLocator {
  entityType: EntityTypes.Note | EntityTypes.Material;
}

interface EntityInfo {
  icon: string | null;
  path: Path;
  title: string;
}

export default abstract class EditableEntity<T extends EntityInfo = EntityInfo> {
  constructor(private readonly entityId: EntityId) {
    makeObservable(this);
    this.load();
    this.loadAnnotations();
  }

  protected readonly remote = container.resolve(rpcToken);
  protected abstract readonly entityType: EditableEntityLocator['entityType'];
  public abstract info?: T;

  @observable
  private annotationMap: Record<AnnotationVO['id'], AnnotationVO> = {};

  @computed
  public get annotations() {
    return Object.values(this.annotationMap);
  }

  protected abstract load(): Promise<void>; // todo: load must return a cancel function.
  public abstract destroy(): void;
  public abstract createEditor(tile: Tile): Editor;

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

  public get entityLocator() {
    return { entityType: this.entityType, entityId: this.entityId };
  }

  public static isEditable(locator: EntityLocator): locator is EditableEntityLocator {
    if (![EntityTypes.Note, EntityTypes.Material].includes(locator.entityType)) {
      return false;
    }

    if (locator.entityType === EntityTypes.Material && !locator.mimeType) {
      return false;
    }

    return true;
  }
}
