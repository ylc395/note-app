import { singleton, container } from 'tsyringe';

import type { SelectEvent } from 'model/abstract/Tree';
import MaterialTree from 'model/material/Tree';
import { EntityTypes } from 'model/entity';
import type { MaterialDTO, DirectoryVO, MaterialVO, ClientMaterialQuery, EntityMaterialVO } from 'model/material';
import type Form from 'model/material/Form';
import { token as remoteToken } from 'infra/remote';

import EditorService from './EditorService';
import type { FileVO, FilesDTO } from 'model/file';

@singleton()
export default class MaterialService {
  private readonly remote = container.resolve(remoteToken);
  readonly materialTree = new MaterialTree();

  constructor() {
    this.materialTree.on('nodeExpanded', this.loadChildren);
    this.materialTree.on('nodeSelected', this.selectMaterial);
  }

  readonly loadChildren = async (parentId: MaterialVO['parentId']) => {
    const { body: materials } = await this.remote.get<ClientMaterialQuery, MaterialVO[]>(
      '/materials',
      parentId ? { parentId } : {},
    );

    this.materialTree.setChildren(materials, parentId);
  };

  private readonly fetchTreeFragment = async (id: MaterialVO['id']) => {
    const { body: fragment } = await this.remote.get<void, MaterialVO[]>(`/materials/${id}/tree-fragment`);
    return fragment;
  };

  readonly createDirectory = async (parentId?: DirectoryVO['parentId']) => {
    const { body: directory } = await this.remote.post<MaterialDTO, DirectoryVO>('/materials', {
      parentId: parentId || null,
    });

    if (parentId) {
      await this.materialTree.toggleExpand(parentId);
    }

    this.materialTree.updateTree(directory);
    this.materialTree.toggleSelect(directory.id);
  };

  readonly createMaterial = async (form: Form) => {
    if (!form.file || (!form.file.data && !form.file.path)) {
      throw new Error('invalid form');
    }

    const { body: files } = await this.remote.patch<FilesDTO, FileVO[]>('/files', [
      {
        ...form.file,
        data: typeof form.file.data === 'string' ? MaterialService.stringToArrayBuffer(form.file.data) : form.file.data,
      },
    ]);

    const newMaterial = await form.validate();
    const { body: material } = await this.remote.post<MaterialDTO, EntityMaterialVO>('/materials', {
      fileId: files[0]!.id,
      ...newMaterial,
    });

    if (material.parentId && !this.materialTree.getNode(material.parentId).isExpanded) {
      await this.materialTree.toggleExpand(material.parentId);
    }

    this.materialTree.updateTree(material);
    this.materialTree.toggleSelect(material.id, { multiple: true });
  };

  private readonly selectMaterial = (materialId: MaterialVO['id'] | null, { multiple }: SelectEvent) => {
    if (!materialId) {
      throw new Error('invalid id');
    }

    const node = this.materialTree.getNode(materialId);

    if (!multiple && node.attributes?.mimeType) {
      const { openEntity } = container.resolve(EditorService);
      openEntity({ type: EntityTypes.Material, id: materialId, mimeType: node.attributes?.mimeType });
    }
  };

  private static stringToArrayBuffer(str: string) {
    const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    const bufView = new Uint16Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }
}
