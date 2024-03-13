import { string } from 'zod';
import { container } from 'tsyringe';
import { observable, makeObservable, action } from 'mobx';
import assert from 'assert';

import Form from '@domain/common/model/abstract/Form';
import Explorer from '@domain/app/model/material/Explorer';
import { isEntityMaterial, type MaterialVO, type NewMaterialDTO } from '@shared/domain/model/material';
import type { FileDTO, FileVO } from '@shared/domain/model/file';
import { Workbench } from '@domain/app/model/workbench';
import { token as rpcToken } from '@domain/common/infra/rpc';
import type { EntityMaterialVO } from '@shared/domain/model/material';
import { fileDTOSchema } from '@shared/domain/model/file';
import { getHash } from '@shared/utils/file';
import { EntityParentId, EntityTypes } from '../../model/entity';

export default class CreationBehavior {
  private readonly remote = container.resolve(rpcToken);
  private readonly workbench = container.resolve(Workbench);
  private readonly explorer = container.resolve(Explorer);

  constructor() {
    makeObservable(this);
  }

  @observable.ref
  public form?: ReturnType<(typeof CreationBehavior)['createForm']>;

  private parentId?: EntityParentId;

  @action.bound
  public startCreating(parentId: EntityParentId) {
    this.form = CreationBehavior.createForm();
    this.parentId = parentId;
  }

  @action.bound
  public stopCreating() {
    this.form = undefined;
    this.parentId = undefined;
  }

  public readonly createDirectory = async (parentId: MaterialVO['parentId']) => {
    const material = await this.createMaterial({ parentId });
    this.explorer.rename.start(material.id);
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
      await this.explorer.reveal(material.parentId, { expand: true, select: true });
    }

    return material;
  }

  public readonly submit = async () => {
    const { form } = this;

    assert(form);

    const result = form.getValues();
    assert(result && result.file);

    const { file, ...material } = result;
    const newMaterial = await this.createMaterial({ ...material, parentId: this.parentId }, file);
    this.stopCreating();

    assert(isEntityMaterial(newMaterial));
    this.workbench.openEntity({
      entityType: EntityTypes.Material,
      entityId: newMaterial.id,
      mimeType: newMaterial.mimeType,
    });
  };

  private static createForm() {
    return new Form({
      title: {
        initialValue: '',
        validate: (v) => !v && '标题不能为空',
      },
      icon: {
        initialValue: null as EntityMaterialVO['icon'],
      },
      sourceUrl: {
        initialValue: null,
        transform: (v) => v || null,
        validate: { schema: string().url().nullable(), message: '必须是一个 URL' },
      },
      comment: {
        initialValue: '',
      },
      file: {
        initialValue: null,
        validate: { schema: fileDTOSchema, message: '文件不得为空' },
      },
    });
  }

  private readonly queryMaterialByHash = async (hash: string) => {
    const materials = await this.remote.material.query.query({ fileHash: hash });
    return materials;
  };

  public readonly handleFileChange = async (files: FileList | null) => {
    const { form } = this;

    assert(form);

    if (files?.[0]) {
      const file = files[0];
      const data = await file.arrayBuffer();
      form.set('file', { mimeType: file.type, path: file.path, data });

      if (!form.get('title')) {
        form.set('title', file.name.replace(/\.[^/.]+$/, ''));
      }

      const hash = getHash(data);
      const materials = await this.queryMaterialByHash(hash);

      if (materials.length > 0) {
        form.setError('file', {
          message: `该文件已存在对应素材${materials.map(({ title }) => title).join()}`,
          fatal: false,
        });
      }
    } else {
      form.set('file', null);
    }
  };
}
