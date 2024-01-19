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
import TreeNode from '@domain/common/model/abstract/TreeNode';
import MaterialEditor from '../model/material/editor/MaterialEditor';
import MoveBehavior from './behaviors/MoveBehavior';
import eventBus, { Events } from '../model/material/eventBus';
import { MOVE_TARGET_MODAL } from '../model/material/prompts';

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

  public readonly move = new MoveBehavior({
    tree: this.tree,
    itemsToIds: MaterialService.getMaterialIds,
    action: (parentId, ids) => this.remote.material.batchUpdate.mutate([ids, { parentId }]),
    promptToken: MOVE_TARGET_MODAL,
    onMoved: (parentId, ids) => ids.forEach((id) => eventBus.emit(Events.Updated, { actor: this, parentId, id })),
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

    this.tree.updateTree(material);
    await this.tree.reveal(material.parentId, true);
    this.tree.toggleSelect(material.id, { value: true });
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
      case 'rename':
        return this.explorer.rename.start(oneId);
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
