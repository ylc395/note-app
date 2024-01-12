import { singleton, container } from 'tsyringe';

import type { NewMaterialDTO, EntityMaterialVO } from '@shared/domain/model/material';
import Explorer from '@domain/app/model/material/Explorer';
import type Form from '@domain/app/model/material/Form';
import { token as rpcToken } from '@domain/common/infra/rpc';

@singleton()
export default class MaterialService {
  private readonly remote = container.resolve(rpcToken);
  private readonly explorer = container.resolve(Explorer);

  private get materialTree() {
    return this.explorer.tree;
  }

  public readonly createMaterial = async (form: Form) => {
    // if (!form.file || (!form.file.data && !form.file.path)) {
    //   throw new Error('invalid form');
    // }
    // const textEncoder = new TextEncoder();
    // const file = await this.remote.file.upload.mutate({ ...form.file });
    // const newMaterial = await form.validate();
    // const { body: material } = await this.remote.post<NewMaterialDTO, EntityMaterialVO>('/materials', {
    //   fileId: files[0]!.id,
    //   parentId: form.values.parentId,
    //   ...newMaterial,
    // });
    // this.materialTree.updateTree(material);
    // if (material.parentId && !this.materialTree.getNode(material.parentId).isExpanded) {
    //   await this.materialTree.toggleExpand(material.parentId);
    // }
    // this.materialTree.toggleSelect(material.id, { isMultiple: true });
  };
}
