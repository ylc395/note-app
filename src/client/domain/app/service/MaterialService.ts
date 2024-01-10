import { singleton, container } from 'tsyringe';

import type { NewMaterialDTO, EntityMaterialVO } from '@shared/domain/model/material';
import Explorer from '@domain/app/model/material/Explorer';
import type Form from '@domain/app/model/material/Form';
import { token as remoteToken } from '@domain/common/infra/remote';

import type { FileVO, FilesDTO } from '@shared/domain/model/file';

@singleton()
export default class MaterialService {
  private readonly remote = container.resolve(remoteToken);
  private readonly explorer = container.resolve(Explorer);

  private get materialTree() {
    return this.explorer.tree;
  }

  public readonly createMaterial = async (form: Form) => {
    if (!form.file || (!form.file.data && !form.file.path)) {
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
    const { body: material } = await this.remote.post<NewMaterialDTO, EntityMaterialVO>('/materials', {
      fileId: files[0]!.id,
      parentId: form.values.parentId,
      ...newMaterial,
    });

    this.materialTree.updateTree(material);

    if (material.parentId && !this.materialTree.getNode(material.parentId).isExpanded) {
      await this.materialTree.toggleExpand(material.parentId);
    }

    this.materialTree.toggleSelect(material.id, { isMultiple: true });
  };
}
