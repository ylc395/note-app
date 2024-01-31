import { container } from 'tsyringe';
import assert from 'assert';
import { observable, makeObservable } from 'mobx';

import { token as rpcToken } from '@domain/common/infra/rpc';
import { EntityId, EntityLocator, EntityTypes, Path } from '../entity';
import type { Tile } from '../workbench';
import type Editor from './Editor';
import type { AnnotationDTO, AnnotationPatchDTO, AnnotationVO } from '@shared/domain/model/annotation';
import { runInAction } from 'mobx';

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

  protected abstract load(): Promise<void>; // todo: load must return a cancel function.
  public abstract destroy(): void;
  public abstract createEditor(tile: Tile): Editor;
  @observable public annotations?: AnnotationVO[];

  private async loadAnnotations() {
    const annotations = await this.remote.annotation.queryByEntityId.query(this.entityId);

    runInAction(() => {
      this.annotations = annotations;
    });
  }

  public readonly createAnnotation = async (
    annotation: Pick<AnnotationDTO, 'selectors' | 'color' | 'body' | 'targetText'>,
  ) => {
    const newAnnotation = await this.remote.annotation.create.mutate({
      targetId: this.entityId,
      ...annotation,
    });

    runInAction(() => {
      assert(this.annotations);
      this.annotations.push(newAnnotation);
    });
  };

  public readonly updateAnnotation = async (id: AnnotationVO['id'], patch: AnnotationPatchDTO) => {
    const annotation = await this.remote.annotation.updateOne.mutate([id, patch]);

    runInAction(() => {
      assert(this.annotations);
      const index = this.annotations.findIndex(({ id }) => annotation.id === id);
      this.annotations[index] = annotation;
    });
  };

  public abstract info?: T;

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
