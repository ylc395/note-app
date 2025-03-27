import assert from 'assert';
import { action, computed, observable, runInAction } from 'mobx';
import { pick } from 'lodash-es';
import { queryClient } from 'mobx-tanstack-query/preset';
import type { Selector } from '@apache-annotator/selector';

import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { type AnnotationVO, type AnnotationPatchDTO, MAX_SELECTORS_COUNT } from '#domain/shared/model/annotation';
import type { NoteVO } from '#domain/shared/model/note';

import { getAnnotationListQueryKey } from './queryKeys';

export default class Editor {
  constructor(
    private readonly options: {
      annotation?: AnnotationVO; // 传这个说明是修改
      noteId?: NoteVO['id']; // 传这个说明是创建
      onDestroyed: () => void;
    },
  ) {
    assert(options.annotation || options.noteId, 'annotation and note can not both be omitted');
    assert(!(options.annotation && options.noteId), 'can not specify both annotation and note');

    runInAction(() => {
      this.value = options.annotation ? pick(options.annotation, ['body', 'color', 'selectors']) : {};
    });
  }

  private readonly remote = container.resolve(rpcToken);

  @observable public accessor value!: AnnotationPatchDTO;

  @action
  public update(value: Pick<AnnotationPatchDTO, 'body' | 'color'>) {
    this.value = { ...this.value, ...value };
  }

  @computed
  public get canAddSelector() {
    return !this.value.selectors || this.value.selectors.length <= MAX_SELECTORS_COUNT;
  }

  @action
  public addSelector(value: Selector) {
    assert(this.canAddSelector, 'can not add selector');
    (this.value.selectors ||= []).push(value);
  }

  @action
  public removeSelector(index: number) {
    assert(this.value.selectors, 'can not remove');
    this.value.selectors.splice(index, 1);
  }

  public async submit() {
    if (this.options.annotation) {
      await this.remote.annotation.updateOne.mutate([this.options.annotation.id, this.value]);
    }

    if (this.options.noteId) {
      assert(this.value.selectors && this.value.selectors.length > 0, 'no selectors when creating');

      await this.remote.annotation.create.mutate({
        targetId: this.options.noteId,
        color: this.value.color,
        body: this.value.body,
        selectors: this.value.selectors,
      });
    }

    const id = this.options.annotation?.targetId ?? this.options.noteId;
    assert(id, 'invalid id');
    queryClient.invalidateQueries({ queryKey: getAnnotationListQueryKey(id) });

    this.destroy();
  }

  public destroy() {
    this.options.onDestroyed?.();
  }
}
