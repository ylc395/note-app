import { singleton, container } from 'tsyringe';

import Explorer from '@domain/app/model/material/Explorer';
import { token as rpcToken } from '@domain/common/infra/rpc';
import { NewMaterialDTO } from '@shared/domain/model/material';
import type { FileDTO, FileVO } from '@shared/domain/model/file';
import { Workbench } from '@domain/app/model/workbench';
import { EntityTypes } from '../model/entity';

@singleton()
export default class MaterialService {
  private readonly remote = container.resolve(rpcToken);
  private readonly explorer = container.resolve(Explorer);
  private readonly workbench = container.resolve(Workbench);

  public get tree() {
    return this.explorer.tree;
  }

  public readonly createMaterial = async (dto?: NewMaterialDTO, file?: FileDTO) => {
    let fileId: FileVO['id'] | undefined;

    if (file) {
      const { id } = await this.remote.file.upload.mutate(file);
      fileId = id;
    }

    const material = await this.remote.material.create.mutate({ ...dto, fileId });

    this.tree.updateTree(material);
    await this.tree.reveal(material.parentId, true);
    this.tree.toggleSelect(material.id, { value: true });
    console.log(this.tree.getNode(material.id));

    this.workbench.openEntity({ entityType: EntityTypes.Material, entityId: material.id });
  };
}
