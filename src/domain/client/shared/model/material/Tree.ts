import { isEntityMaterial, normalizeTitle, type MaterialVO } from '#domain/shared/model/material';
import { EntityTypes } from '#domain/shared/model/entity';

import Tree from '../abstract/Tree';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '../../infra/rpc';

export default class MaterialTree extends Tree<MaterialVO> {
  private readonly remote = container.resolve(rpcToken);

  protected toEntityLocator(node: MaterialVO) {
    return {
      entityId: node.id,
      entityType: EntityTypes.Material,
      mimeType: isEntityMaterial(node) ? node.file.mimeType : undefined,
    };
  }

  protected queryChildren(id: MaterialVO['parentId'] | MaterialVO['id'][], signal?: AbortController['signal']) {
    return this.remote.material.query.query({ parentId: id }, { signal });
  }

  protected queryPath(id: MaterialVO['id']) {
    return this.remote.material.queryPath.query(id);
  }

  protected nodeToView(material: MaterialVO | null) {
    return {
      title: material ? normalizeTitle(material) : '根',
      icon: material?.icon ?? null,
    };
  }
}
