import { action, computed, observable, runInAction } from 'mobx';
import assert from 'assert';

import { createQuery } from 'mobx-tanstack-query/preset';
import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { token as imageResizerToken } from '#domain/shared/infra/imageResizer';
import DomainEventBus from '#domain/client/app/model/note/EventBus';

import { getHash } from '#utils/file';
import type { FileDTO } from '#domain/shared/model/file';
import type { NoteVO } from '#domain/shared/model/note';

type Icon = Required<Pick<FileDTO, 'data' | 'mimeType'>>;

export default class CustomIconPicker {
  constructor(private readonly options: { noteIds: NoteVO['id'][]; onSubmit?: () => void }) {}

  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  private readonly imageResizer = container.resolve(imageResizerToken);

  public position?: { x: number; y: number };

  @observable.ref public accessor icon: Icon | undefined = undefined;

  public readonly isDuplicated = createQuery(
    async () => {
      const iconHash = await getHash(this.icon!.data);
      return Boolean(await this.remote.file.queryOneByHash.query(iconHash));
    },
    { queryKey: ['icon', this.icon], options: () => ({ enabled: Boolean(this.icon) }) },
  );

  @computed public get canSubmit() {
    return Boolean(this.icon) && this.isDuplicated.result.data === false;
  }

  public async set(file: Icon | undefined) {
    runInAction(() => {
      this.icon = undefined;
    });

    if (!file) {
      return;
    }

    const resized = await this.imageResizer.resize({
      image: file.data,
      width: 64,
      height: 64,
      mimeType: file.mimeType,
    });

    runInAction(() => {
      this.icon = { data: resized, mimeType: file.mimeType };
    });
  }

  public async submit() {
    assert(this.canSubmit);
    const file = await this.remote.file.upload.mutate(this.icon!);
    const icon = { type: 'file', code: file.id } as const;
    await this.remote.note.batchUpdate.mutate([this.options.noteIds, { icon }]);

    for (const noteId of this.options.noteIds) {
      this.eventBus.emit(DomainEventBus.eventNames.Updated, { id: noteId, payload: { icon } });
    }

    this.options.onSubmit?.();
  }

  @action
  public destroy() {
    this.isDuplicated.destroy();
  }
}
