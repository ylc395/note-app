import { singleton, container } from 'tsyringe';
import { makeObservable, observable } from 'mobx';

import type { SelectEvent } from 'model/abstract/Tree';
import { EntityTypes } from 'model/entity';
import {
  type NewMaterialDTO,
  type MaterialDirectoryVO,
  type MaterialVO,
  type ClientMaterialQuery,
  type MaterialEntityVO,
  isDirectory,
} from 'model/material';
import Explorer from 'model/Explorer';
import type Form from 'model/material/Form';
import Value from 'model/Value';
import { token as remoteToken } from 'infra/remote';

import EditorService from './EditorService';
import type { FileVO, FilesDTO } from 'model/file';

@singleton()
export default class MaterialService {
  private readonly remote = container.resolve(remoteToken);
  private readonly explorer = container.resolve(Explorer);

  get materialTree() {
    return this.explorer.materialTree;
  }
  @observable readonly targetId = new Value<MaterialVO['id']>();

  constructor() {
    this.materialTree.on('nodeExpanded', this.loadChildren);
    this.materialTree.on('nodeSelected', this.handleSelectMaterial);
    makeObservable(this);
  }

  readonly loadChildren = async (parentId?: MaterialVO['parentId']) => {
    const { body: materials } = await this.remote.get<ClientMaterialQuery, MaterialVO[]>(
      '/materials',
      parentId ? { parentId } : {},
    );

    this.materialTree.updateChildren(parentId || null, materials);
  };

  readonly createDirectory = async (parentId?: MaterialDirectoryVO['parentId']) => {
    const { body: directory } = await this.remote.post<NewMaterialDTO, MaterialDirectoryVO>('/materials', {
      parentId: parentId || null,
    });

    this.materialTree.updateTree(directory);

    if (parentId) {
      await this.materialTree.toggleExpand(parentId);
    }

    this.materialTree.toggleSelect(directory.id);
  };

  readonly createMaterial = async (form: Form) => {
    if (!form.file || !this.targetId.value || (!form.file.data && !form.file.path)) {
      throw new Error('invalid form');
    }

    const textEncoder = new TextEncoder();
    const { body: files } = await this.remote.patch<FilesDTO, FileVO[]>('/files', [
      {
        ...form.file,
        data: typeof form.file.data === 'string' ? textEncoder.encode(form.file.data).buffer : form.file.data,
        lang: 'chi_sim',
      },
    ]);

    const newMaterial = await form.validate();
    const { body: material } = await this.remote.post<NewMaterialDTO, MaterialEntityVO>('/materials', {
      fileId: files[0]!.id,
      parentId: this.targetId.value,
      ...newMaterial,
    });

    this.materialTree.updateTree(material);

    if (material.parentId && !this.materialTree.getNode(material.parentId).isExpanded) {
      await this.materialTree.toggleExpand(material.parentId);
    }

    this.materialTree.toggleSelect(material.id, { multiple: true });
    this.targetId.reset();
  };

  private readonly handleSelectMaterial = ({ id: materialId, multiple }: SelectEvent) => {
    if (!materialId) {
      throw new Error('invalid id');
    }

    const node = this.materialTree.getNode(materialId);

    if (!multiple && node.entity && !isDirectory(node.entity)) {
      const { openEntity } = container.resolve(EditorService);
      openEntity({ entityType: EntityTypes.Material, entityId: materialId, mimeType: node.entity.mimeType });
    }
  };
}
