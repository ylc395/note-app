import assert from 'assert';
import { action, observable } from 'mobx';
import { uniqueId } from 'lodash-es';
import { queryClient } from 'mobx-tanstack-query/preset';

import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { AnnotationVO, Selector, type AnnotationDTO, type AnnotationPatchDTO } from '#domain/shared/model/annotation';
import type { NoteVO } from '#domain/shared/model/note';

import { getAnnotationListQueryKey } from './queryKeys';
import type Collection from '../common/Collection';

export default class Editor {
  constructor(
    private readonly options: {
      initialValue?: AnnotationVO;
      noteId?: NoteVO['id'];
      onDestroyed: (editor: Editor) => void; // AnnotationEditor 的生命周期很简单，无需继承 EventBus 来获得完整的事件管理能力
    },
  ) {
    assert(options.initialValue || options.noteId, 'annotation and note can not both be omitted');
    assert(!(options.initialValue && options.noteId), 'can not specify both annotation and note');

    this.init();
  }

  public readonly id = uniqueId('annotation-editor-');

  private readonly remote = container.resolve(rpcToken);

  @action
  private init() {
    this.value = this.options.initialValue || {};
  }

  @observable public accessor value!: AnnotationPatchDTO;

  @action
  public update(value: Pick<AnnotationPatchDTO, 'body' | 'color'>) {
    this.value = { ...this.value, ...value };
  }

  @action
  public addSelector(value: Selector) {
    (this.value.selectors ||= []).push(value);
  }

  @action
  public removeSelector(index: number) {
    assert(this.value.selectors, 'can not remove');
    this.value.selectors.splice(index, 1);
  }

  @observable public accessor isSubmitting = false;

  public async submit() {
    this.isSubmitting = true;

    if (this.options.initialValue) {
      const id = this.options.initialValue.id;

      try {
        await this.remote.annotation.updateOne.mutate([id, this.value]);
      } catch {
        this.isSubmitting = false;
        return;
      }

      queryClient.setQueryData<Collection<AnnotationVO>>(
        getAnnotationListQueryKey(this.options.initialValue.targetId),
        (list) => list?.update(id, this.value),
      );
    }

    if (this.options.noteId) {
      assert((this.value.selectors?.length ?? 0) > 0, 'no selector when creating');

      let newAnnotation;

      try {
        newAnnotation = await this.remote.annotation.create.mutate({
          targetId: this.options.noteId,
          ...this.value,
        } as AnnotationDTO);
      } catch {
        this.isSubmitting = false;
        return;
      }

      queryClient.setQueryData<Collection<AnnotationVO>>(getAnnotationListQueryKey(this.options.noteId), (list) =>
        list?.add(newAnnotation),
      );
    }

    this.isSubmitting = false;
    this.destroy();
  }

  public destroy() {
    this.options.onDestroyed?.(this);
  }
}
