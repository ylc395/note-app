import { makeObservable, observable, runInAction } from 'mobx';
import { container } from 'tsyringe';
import uid from 'lodash/uniqueId';

import type { MaterialVO } from 'interface/Material';
import { type Remote, token as remoteToken } from 'infra/Remote';

export default class MaterialWindow {
  readonly id = uid('window-');
  @observable.ref blob?: ArrayBuffer;

  readonly #remote: Remote = container.resolve(remoteToken);
  readonly #material: MaterialVO;

  constructor(material: MaterialVO) {
    this.#material = material;
    makeObservable(this);

    this.#load();
  }

  #load = async () => {
    const { file } = this.#material;

    if (!file) {
      throw new Error('no file');
    }

    const { body } = await this.#remote.get<void, ArrayBuffer>(`/files/${file.id}/blob`);

    runInAction(() => {
      this.blob = body;
    });
  };
}
