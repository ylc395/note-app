import { singleton } from 'tsyringe';

import type { MaterialFile } from 'model/Material';

@singleton()
export default class MaterialRepository {
  readonly add = async (files: MaterialFile[]) => {
    window.electronIpc.request(files);
  };
}
