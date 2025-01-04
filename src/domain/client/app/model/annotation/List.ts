import assert from 'assert';

import { container } from '#domain/shared/infra/singletons';
import type { AnnotationVO } from '#domain/shared/model/annotation';
import type { NoteVO } from '#domain/shared/model/note';
import { onlyWhen } from '#utils/function';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import { eventBus as domainEventBus, EventNames as DomainEventNames } from './eventBus';
import Editor from './Editor';
import LoadableCollection from '../common/LoadableCollection';
import Collection from '../common/Collection';

export default class AnnotationList extends LoadableCollection<AnnotationVO> {
  constructor(options: {
    noteId: NoteVO['id'];
    sort: (annotation1: AnnotationVO, annotation2: AnnotationVO) => number;
  }) {
    super();

    this.noteId = options.noteId;
    this.sort = options.sort;

    domainEventBus.on(
      DomainEventNames.Removed,
      onlyWhen(
        ({ id }) => this.has(id),
        ({ id }) => this.remove(id),
      ),
    );
    domainEventBus.on(
      DomainEventNames.Updated,
      onlyWhen(
        ({ id }) => this.has(id),
        ({ id, payload }) => this.update(id, payload),
      ),
    );
    domainEventBus.on(
      DomainEventNames.Created,
      onlyWhen(({ targetId }) => targetId === options.noteId, this.add.bind(this)),
    );
  }

  private readonly remote = container.resolve(rpcToken);

  private readonly noteId: NoteVO['id'];

  private readonly sort: (item1: AnnotationVO, it: AnnotationVO) => number;

  public override get value() {
    return super.value.sort(this.sort);
  }

  protected queryItems(): Promise<AnnotationVO[]> {
    assert(this.loadingController?.signal);
    return this.remote.annotation.queryByEntityId.query(this.noteId, { signal: this.loadingController.signal });
  }

  public readonly editors = new Collection<Editor>();

  public initEditor(annotation?: AnnotationVO) {
    assert(!annotation || this.has(annotation), 'invalid annotation');

    const newEditor = new Editor({
      annotation,
      noteId: this.noteId,
      onDestroyed: this.editors.remove.bind(this.editors),
    });

    this.editors.add(newEditor);
  }

  public override destroy() {
    super.destroy();
  }
}
