import { singleton, container } from 'tsyringe';
import assert from 'assert';

import Explorer from '@domain/app/model/material/Explorer';
import { token as rpcToken } from '@domain/common/infra/rpc';
import { token as UIToken } from '@shared/domain/infra/ui';
import { isEntityMaterial, type MaterialVO, type NewMaterialDTO } from '@shared/domain/model/material';
import type { FileDTO, FileVO } from '@shared/domain/model/file';
import { Workbench } from '@domain/app/model/workbench';
import { EntityParentId, EntityTypes } from '../model/entity';
import TreeNode from '@domain/common/model/abstract/TreeNode';
import MaterialEditor from '../model/material/editor/MaterialEditor';
import MoveBehavior from '../model/abstract/behaviors/MoveBehavior';
import eventBus, { type ActionEvent, Events } from '../model/material/eventBus';
import { MOVE_TARGET_MODAL, NEW_MATERIAL_MODAL } from '../model/material/prompts';

@singleton()
export default class MaterialService {
  constructor() {
    eventBus.on(Events.Action, this.handleAction);
  }
  private readonly remote = container.resolve(rpcToken);
  private readonly explorer = container.resolve(Explorer);
  private readonly ui = container.resolve(UIToken);
  private readonly workbench = container.resolve(Workbench);

  private readonly moveMaterials = async (parentId: EntityParentId, ids: MaterialVO['id'][]) => {
    await this.remote.material.batchUpdate.mutate([ids, { parentId }]);
    ids.forEach((id) => eventBus.emit(Events.Updated, { trigger: this.move, parentId, id }));
  };

  public readonly move = new MoveBehavior({
    tree: this.explorer.tree,
    itemsToIds: MaterialService.getMaterialIds,
    promptToken: MOVE_TARGET_MODAL,
    onMove: this.moveMaterials,
  });

  public readonly queryMaterialByHash = async (hash: string) => {
    const materials = await this.remote.material.query.query({ fileHash: hash });
    return materials;
  };

  private async createMaterial(dto?: NewMaterialDTO, file?: FileDTO) {
    let fileId: FileVO['id'] | undefined;

    if (file) {
      const { id } = await this.remote.file.upload.mutate(file);
      fileId = id;
    }

    const material = await this.remote.material.create.mutate({ ...dto, fileId });

    this.explorer.tree.updateTree(material);

    if (material.parentId) {
      await this.explorer.tree.reveal(material.parentId, { expand: true, select: true });
    }

    return material;
  }

  public readonly createDirectory = async (parentId: MaterialVO['parentId']) => {
    const material = await this.createMaterial({ parentId });
    this.explorer.rename.start(material.id);
  };

  public readonly createMaterialFromFile = async (parentId: MaterialVO['parentId']) => {
    const result = await this.ui.prompt(NEW_MATERIAL_MODAL);

    if (!result) {
      return;
    }

    const { file, ...material } = result;
    const newMaterial = await this.createMaterial({ ...material, parentId }, file);
    assert(isEntityMaterial(newMaterial));

    this.workbench.openEntity({
      entityType: EntityTypes.Material,
      entityId: newMaterial.id,
      mimeType: newMaterial.mimeType,
    });
  };

  private readonly handleAction = ({ action, id }: ActionEvent) => {
    const oneId = id[0];
    assert(oneId);

    switch (action) {
      case 'move':
        return this.move.byUserInput();
      default:
        break;
    }
  };

  public static getMaterialIds(item: unknown) {
    if (item instanceof TreeNode && item.entityLocator.entityType === EntityTypes.Material) {
      return item.tree.getSelectedNodeIds();
    }

    if (item instanceof MaterialEditor) {
      return [item.entityLocator.entityId];
    }
  }
}
