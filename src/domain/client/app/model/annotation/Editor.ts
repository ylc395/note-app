import assert from 'assert';
import { action, observable } from 'mobx';
import { uniqueId } from 'lodash-es';
import { createMutation, queryClient } from 'mobx-tanstack-query/preset';

import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { AnnotationVO, Selector, AnnotationPatchDTO } from '#domain/shared/model/annotation';
import type { NoteVO } from '#domain/shared/model/note';

import { getAnnotationListQueryKey } from './queryKeys';

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

  public readonly submit = createMutation(
    async () => {
      if (this.options.initialValue) {
        return this.remote.annotation.updateOne.mutate([this.options.initialValue.id, this.value]);
      }

      if (this.options.noteId) {
        assert(this.value.selectors && this.value.selectors.length > 0, 'no selectors when creating');

        return this.remote.annotation.create.mutate({
          targetId: this.options.noteId,
          color: this.value.color,
          body: this.value.body,
          selectors: this.value.selectors,
        });
      }

      assert.fail('can not submit');
    },
    {
      onSuccess: () => {
        const id = this.options.initialValue?.targetId ?? this.options.noteId;
        assert(id, 'invalid id');

        queryClient.invalidateQueries({ queryKey: getAnnotationListQueryKey(id) });
        this.destroy();
      },
    },
  );

  public destroy() {
    this.options.onDestroyed?.(this);
  }
}
