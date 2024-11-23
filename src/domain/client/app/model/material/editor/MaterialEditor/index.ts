import { computed, observable, runInAction } from 'mobx';
import { flow } from 'lodash-es';

import { IS_DEV } from '#domain/shared/infra/constants';
import { normalizeTitle, type EntityMaterialVO, type MaterialPatchDTO } from '#domain/shared/model/material';
import { AnnotationVO } from '#domain/shared/model/annotation';
import { EntityTypes, type EntityPath } from '#domain/shared/model/entity';
import { materialPatchDTOSchema } from '#domain/shared/infra/apiSchema/material';
import { onlyWhen } from '#utils/function';

import Editor from '../../../abstract/Editor';
import type Tile from '../../../workbench/Tile';
import { eventBus, EventNames as MaterialEventNames } from '../../eventBus';
import AnnotationList from './AnnotationList';

export default abstract class MaterialEditor<S> extends Editor<EntityMaterialVO, MaterialPatchDTO, S> {
  constructor(materialId: EntityMaterialVO['id'], tile: Tile) {
    super({ entityId: materialId, tile, schema: materialPatchDTOSchema });

    this.annotationList = new AnnotationList({
      materialId,
      sort: this.sortAnnotations,
    });

    this._dispose = flow([
      eventBus.on(
        MaterialEventNames.Updated,
        onlyWhen((e) => e.id === materialId && e.trigger !== this, this.init.bind(this)),
      ),
      eventBus.on(
        MaterialEventNames.Removed,
        onlyWhen((e) => e.id === materialId, this.destroy.bind(this)),
      ),
    ]);
  }

  protected abstract sortAnnotations(annotation1: AnnotationVO, annotation2: AnnotationVO): number;

  protected readonly entityType = EntityTypes.Material;

  @observable public accessor path: EntityPath | undefined;

  @observable.ref public accessor blob: ArrayBuffer | undefined;

  private readonly _dispose: () => void;

  public readonly annotationList: AnnotationList;

  protected async upload(patch: MaterialPatchDTO, signal: AbortController['signal']) {
    await this.remote.material.updateOne.mutate([this.entityLocator.entityId, patch], { signal });

    eventBus.emit(MaterialEventNames.Updated, {
      id: this.entityLocator.entityId,
      payload: patch,
      trigger: this,
    });
  }

  protected async load(signal: AbortController['signal']) {
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

  @computed
  public get view() {
    const titlePrefix = IS_DEV ? `${this.id} ${this.entityLocator.entityId.slice(0, 3)} ` : '';

    return {
      readableTitle: titlePrefix + (this.entity ? normalizeTitle(this.entity) : ''),
      icon: this.entity?.icon || null,
      title: this.entity?.title ?? '',
      body: this.entity?.body ?? '',
    };
  }

  public destroy(): void {
    this._dispose();
    super.destroy();
  }
}
