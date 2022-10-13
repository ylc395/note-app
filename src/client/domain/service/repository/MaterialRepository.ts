import { container, singleton } from 'tsyringe';

import type { MaterialFile } from 'model/Material';
import { token } from './remote';

@singleton()
export default class MaterialRepository {
  #remote = container.resolve(token);
  readonly add = async (files: MaterialFile[]) => {
    this.#remote.post('materials', files);
  };
}
