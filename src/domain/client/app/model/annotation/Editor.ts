import assert from 'assert';
import { action, computed, observable } from 'mobx';
import { uniqueId, zipObject } from 'lodash-es';

import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { AnnotationVO, Selector, type AnnotationPatchDTO } from '#domain/shared/model/annotation';
import type { NoteVO } from '#domain/shared/model/note';
import { eventBus as domainEventBus, EventNames as DomainEventNames } from './eventBus';

export default class Editor {
  constructor(
    private readonly options: {
      annotation?: AnnotationVO;
      noteId?: NoteVO['id'];
      onDestroyed: (editor: Editor) => void; // AnnotationEditor 的生命周期很简单，无需继承 EventBus 来获得完整的事件管理能力
    },
  ) {
    assert(options.annotation || options.noteId, 'annotation and note can not both be omitted');
    assert(!(options.annotation && options.noteId), 'can not specify both annotation and note');

    this.init();
  }

  public readonly id = uniqueId('annotation-editor-');

  private readonly remote = container.resolve(rpcToken);

  @action
  private init() {
    this.value = this.options.annotation || {};

    if (this.options.annotation) {
      this.selectorsMap = zipObject(
        this.options.annotation.selectors.map((_, i) => i),
        this.options.annotation.selectors,
      );
    }
  }

  @observable public accessor value!: Pick<AnnotationPatchDTO, 'body' | 'color'>;

  @observable private accessor selectorsMap: Record<string, Selector> = {};

  @computed
  public get selectors() {
    return Object.entries(this.selectorsMap).map(([id, selector]) => ({ ...selector, id }));
  }

  @action
  public update(value: Pick<AnnotationPatchDTO, 'body' | 'color'>) {
    this.value = { ...this.value, ...value };
  }

  @action
  public addSelector(value: Selector) {
    const maxId = Math.max(...this.selectors.map((id) => Number(id)));
    this.selectorsMap[maxId + 1] = value;
  }

  @action
  public removeSelector(id: string) {
    delete this.selectorsMap[id];
  }

  public async submit() {
    if (this.options.annotation) {
      await this.remote.annotation.updateOne.mutate([this.options.annotation.id, this.value]);

      domainEventBus.emit(DomainEventNames.Updated, {
        id: this.options.annotation.id,
        payload: this.value,
      });
    }

    if (this.options.noteId) {
      assert(this.selectors.length > 0, 'no selector when creating');

      const newAnnotation = await this.remote.annotation.create.mutate({
        targetId: this.options.noteId,
        ...this.value,
        selectors: this.selectors,
      });

      domainEventBus.emit(DomainEventNames.Created, newAnnotation);
    }

    this.destroy();
  }

  public destroy() {
    this.options.onDestroyed?.(this);
  }
}
