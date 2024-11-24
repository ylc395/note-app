import { flow } from 'lodash-es';
import { action, observable } from 'mobx';
import assert from 'assert';

import type { EntityMaterialVO } from '#domain/shared/model/material';
import type { AnnotationVO } from '#domain/shared/model/annotation';
import { onlyWhen } from '#utils/function';

import List from '../../../abstract/List';
import { eventBus as annotationEventBus, EventNames as AnnotationEventNames } from '../../../annotation/eventBus';
import Editor from '../../../annotation/Editor';

export default class AnnotationList extends List<AnnotationVO> {
  constructor(options: {
    materialId: EntityMaterialVO['id'];
    sort: (annotation1: AnnotationVO, annotation2: AnnotationVO) => number;
  }) {
    super();

    this.materialId = options.materialId;
    this.sort = options.sort;
    this.dispose = flow([
      annotationEventBus.on(AnnotationEventNames.Removed, ({ id }) => this.removeById(id)),
      annotationEventBus.on(AnnotationEventNames.Updated, ({ id }) => this.load(id)),
      annotationEventBus.on(
        AnnotationEventNames.Created,
        onlyWhen(({ targetId }) => targetId === options.materialId, this.add.bind(this)),
      ),
    ]);
  }

  private readonly materialId: EntityMaterialVO['id'];

  protected readonly sort: (item1: AnnotationVO, it: AnnotationVO) => number;

  private readonly dispose: () => void;

  protected query(signal: AbortController['signal']): Promise<AnnotationVO[]>;
  protected query(signal: AbortController['signal'], id: AnnotationVO['id']): Promise<AnnotationVO>;
  protected query(signal: AbortController['signal'], id?: AnnotationVO['id']) {
    return id
      ? this.remote.annotation.queryOne.query(id, { signal })
      : this.remote.annotation.queryByEntityId.query(this.materialId, { signal });
  }

  @observable.ref private accessor annotationEditorsMap: Record<AnnotationVO['id'] | symbol, Editor> = {};

  public getEditor(id?: AnnotationVO['id']) {
    return this.annotationEditorsMap[id || AnnotationList.NEW_EDITOR_ID];
  }

  public initEditor(annotation?: AnnotationVO) {
    assert(!annotation || this.itemsMap[annotation.id], 'invalid annotation');
    const id = annotation?.id || AnnotationList.NEW_EDITOR_ID;

    this.annotationEditorsMap[id] = new Editor({
      annotation,
      materialId: this.materialId,
      onDestroyed: this.removeEditor.bind(this, id),
    });
  }

  @action
  private removeEditor(id: AnnotationVO['id'] | symbol) {
    delete this.annotationEditorsMap[id];
  }

  public destroy() {
    this.dispose();
    super.destroy();
  }

  private static readonly NEW_EDITOR_ID = Symbol();
}
