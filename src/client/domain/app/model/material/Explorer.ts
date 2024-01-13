import { singleton } from 'tsyringe';

import type { MaterialVO } from '@shared/domain/model/material';
import type { MenuItem } from '@shared/domain/infra/ui';
import MaterialTree from '@domain/common/model/material/Tree';
import Explorer from '@domain/app/model/abstract/Explorer';

@singleton()
export default class MaterialExplorer extends Explorer<MaterialVO> {
  constructor() {
    super('materialExplorer');
  }

  public async getContextmenu() {
    return [] as MenuItem[];
  }

  public readonly tree = new MaterialTree();
}
