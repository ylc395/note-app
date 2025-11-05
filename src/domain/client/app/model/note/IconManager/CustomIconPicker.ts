import { action, computed, observable, runInAction } from 'mobx';
import assert from 'assert';

import { createQuery } from 'mobx-tanstack-query/preset';
import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { token as imageResizerToken } from '#domain/shared/infra/imageResizer';

import { getHash } from '#utils/file';
import type { FileDTO, FileVO } from '#domain/shared/model/file';

type Icon = Required<Pick<FileDTO, 'data' | 'mimeType'>>;

// 新建并设置图标
export default class CustomIconPicker {
  constructor(
    private readonly options: {
      onDestroy?: () => void;
      onSubmit?: (e: { isNewIcon: boolean; fileId: FileVO['id'] }) => void;
    },
  ) {}

  private readonly remote = container.resolve(rpcToken);

  private readonly imageResizer = container.resolve(imageResizerToken);

  @observable.ref public accessor icon: Icon | undefined = undefined;

  public readonly duplicatedIconFile = createQuery(
    async () => {
      if (!this.icon) {
        return null;
      }

      const iconHash = await getHash(this.icon.data);
      return this.remote.file.queryOneByHash.query(iconHash);
    },
    { queryKey: ['icon', this.icon] },
  );

  @computed public get canSubmit() {
    return Boolean(this.icon) && !this.duplicatedIconFile.result.isFetching;
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

  public readonly submit = async () => {
    assert(this.canSubmit);

    const file = this.duplicatedIconFile.result.data ?? (await this.remote.file.upload.mutate(this.icon!));
    this.options.onSubmit?.({ isNewIcon: !this.duplicatedIconFile.result.data, fileId: file.id });
  };

  @action
  public destroy() {
    this.duplicatedIconFile.destroy();
    this.options.onDestroy?.();
  }
}
