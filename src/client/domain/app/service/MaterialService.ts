import { singleton, container } from 'tsyringe';

import Explorer, { EventNames as explorerEvents, type ActionEvent } from '@domain/app/model/material/Explorer';
import { token as rpcToken } from '@domain/common/infra/rpc';
import { NewMaterialDTO } from '@shared/domain/model/material';
import type { FileDTO, FileVO } from '@shared/domain/model/file';
import { Workbench } from '@domain/app/model/workbench';
import { EntityTypes } from '../model/entity';
import assert from 'assert';

@singleton()
export default class MaterialService {
  private readonly remote = container.resolve(rpcToken);
  private readonly explorer = container.resolve(Explorer);
  private readonly workbench = container.resolve(Workbench);

  constructor() {
    this.explorer.on(explorerEvents.Action, this.handleAction);
  }

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
    this.explorer.startEditing(material.id);
    this.workbench.openEntity({ entityType: EntityTypes.Material, entityId: material.id });
  };

  private readonly handleAction = ({ action, id }: ActionEvent) => {
    const oneId = id[0];
    assert(oneId);

    switch (action) {
      case 'rename':
        return this.explorer.startEditing(oneId);
      default:
        break;
    }
  };
}
