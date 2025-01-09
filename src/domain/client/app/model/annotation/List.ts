import assert from 'assert';
import { computed } from 'mobx';
import { createQuery } from 'mobx-tanstack-query/preset';

import { container } from '#domain/shared/infra/singletons';
import type { AnnotationVO } from '#domain/shared/model/annotation';
import type { NoteVO } from '#domain/shared/model/note';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import Editor from './Editor';
import Collection from '../../../shared/model/abstract/Collection';
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
        return new Collection(await this.remote.annotation.queryByEntityId.query(this.noteId, { signal }));
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
  public get value() {
    return this.annotations.result.data?.value.sort(this.sort);
  }

  @computed
  public get isLoading() {
    return this.annotations.result.isLoading;
  }

  public readonly editors = new Collection<Editor>();

  public initEditor(annotation?: AnnotationVO) {
    assert(!annotation || this.annotations.result.data?.has(annotation), 'invalid annotation');

    const newEditor = new Editor({
      initialValue: annotation,
      noteId: this.noteId,
      onDestroyed: this.editors.remove.bind(this.editors),
    });

    this.editors.add(newEditor);
  }

  public destroy() {
    this.destroyController.abort();
  }
}
