import { container, singleton } from 'tsyringe';

import type { RawMaterial } from 'model/Material';
import { token } from './remote';

@singleton()
export default class MaterialRepository {
  #remote = container.resolve(token);
  readonly add = async (files: RawMaterial[]) => {
    const res = await this.#remote.post('/materials', files);
    console.log(res);
  };
}
