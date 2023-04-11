import { singleton, container } from 'tsyringe';

import type { MaterialDTO, DirectoryVO, MaterialVO, MaterialQuery } from 'interface/material';
import { token as remoteToken } from 'infra/Remote';
import MaterialTree from 'model/material/Tree';

@singleton()
export default class MaterialService {
  private readonly remote = container.resolve(remoteToken);

  private readonly fetchChildren = async (parentId: MaterialVO['parentId']) => {
    const { body: materials } = await this.remote.get<MaterialQuery, MaterialVO[]>(
      '/materials',
      parentId ? { parentId } : {},
    );
    return materials;
  };

  private readonly fetchTreeFragment = async (id: MaterialVO['id']) => {
    const { body: fragment } = await this.remote.get<void, MaterialVO[]>(`/materials/${id}/tree-fragment`);
    return fragment;
  };

  readonly materialTree = new MaterialTree({
    fetchChildren: this.fetchChildren,
    fetchTreeFragment: this.fetchTreeFragment,
  });

  async createDirectory(parent?: DirectoryVO) {
    const { body: directory } = await this.remote.post<MaterialDTO, DirectoryVO>(
      '/materials',
      parent ? { parentId: parent.id } : {},
    );
  }
}
