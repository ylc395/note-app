import { singleton, container } from 'tsyringe';
import assert from 'assert';

import Explorer, { EventNames as explorerEvents, type ActionEvent } from '@domain/app/model/material/Explorer';
import { token as rpcToken } from '@domain/common/infra/rpc';
import { token as UIToken } from '@shared/domain/infra/ui';
import { isEntityMaterial, type MaterialVO, type NewMaterialDTO } from '@shared/domain/model/material';
import type { FileDTO, FileVO } from '@shared/domain/model/file';
import { Workbench } from '@domain/app/model/workbench';
import { EntityTypes } from '../model/entity';
import { NEW_MATERIAL_MODAL } from '../model/material/modals';

@singleton()
export default class MaterialService {
  private readonly remote = container.resolve(rpcToken);
  private readonly explorer = container.resolve(Explorer);
  private readonly ui = container.resolve(UIToken);
  private readonly workbench = container.resolve(Workbench);

  constructor() {
    this.explorer.on(explorerEvents.Action, this.handleAction);
  }

  private get tree() {
    return this.explorer.tree;
  }

  public readonly queryMaterialByHash = async (hash: string) => {
    const materials = await this.remote.material.query.query({ fileHash: hash });
    return materials;
  };

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

    if (isEntityMaterial(material)) {
      this.workbench.openEntity({
        entityType: EntityTypes.Material,
        entityId: material.id,
        mimeType: material.mimeType,
      });
    } else {
      this.explorer.startRenaming(material.id);
    }
  };

  public readonly createMaterialFromFile = async (parentId: MaterialVO['parentId']) => {
    const result = await this.ui.prompt(NEW_MATERIAL_MODAL);

    if (!result) {
      return;
    }

    const { file, ...material } = result;
    return this.createMaterial({ ...material, parentId }, file);
  };

  private readonly handleAction = ({ action, id }: ActionEvent) => {
    const oneId = id[0];
    assert(oneId);

    switch (action) {
      case 'rename':
        return this.explorer.startRenaming(oneId);
      default:
        break;
    }
  };
}
