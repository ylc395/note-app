import assert from 'assert';
import { action, computed, observable } from 'mobx';
import { createQuery } from 'mobx-tanstack-query/preset';

import { container } from '#domain/shared/infra/singletons';
import type { AnnotationVO } from '#domain/shared/model/annotation';
import type { NoteVO } from '#domain/shared/model/note';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import Editor from './Editor';
import { getAnnotationListQueryKey } from './queryKeys';

export default class AnnotationList {
  constructor(options: {
    noteId: NoteVO['id'];
    sort: (annotation1: AnnotationVO, annotation2: AnnotationVO) => number;
  }) {
    this.noteId = options.noteId;
    this.sort = options.sort;

    this.annotations = createQuery(
      async ({ signal }) => {
        const annotations = await this.remote.annotation.queryByEntityId.query(this.noteId, { signal });
        return new Map(annotations.map((annotation) => [annotation.id, annotation]));
      },
      {
        queryKey: getAnnotationListQueryKey(this.noteId),
        abortSignal: this.destroyController.signal,
      },
    );
  }

  private readonly destroyController = new AbortController();

  private readonly remote = container.resolve(rpcToken);

  private readonly noteId: NoteVO['id'];

  private readonly annotations;

  private readonly sort: (item1: AnnotationVO, it: AnnotationVO) => number;

  @computed
  public get sortedValue() {
    return Array.from(this.annotations.result.data?.values() || []).sort(this.sort);
  }

  @computed
  public get isLoading() {
    return this.annotations.result.isLoading;
  }

  // 一次只能有一个 editor，无论是修改的还是新增的
  @observable public accessor editor: Editor | undefined;

  public addEditor(annotationId?: AnnotationVO['id']) {
    assert(!annotationId || this.annotations.result.data?.has(annotationId), 'invalid annotation');

    this.editor = new Editor({
      initialValue: annotationId ? this.annotations.result.data?.get(annotationId) : undefined,
      noteId: this.noteId,
      onDestroyed: action(() => {
        this.editor = undefined;
      }),
    });
  }

  public destroy() {
    this.destroyController.abort();
  }
}
