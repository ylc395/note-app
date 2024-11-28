import { action, observable } from 'mobx';
import { string, z } from 'zod';
import { constant, first } from 'lodash-es';
import assert from 'assert';

import Form from '#domain/client/shared/model/abstract/Form';
import { container } from '#domain/shared/infra/singletons';
import { getHash } from '#utils/file';
import Explorer from '#domain/client/app/model/material/Explorer';
import type { MaterialVO } from '#domain/shared/model/material';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import { EntityTypes } from '#domain/client/shared/model/entity';
import Workbench from '../workbench/Workbench';

export default class CreationProcess {
  private readonly remote = container.resolve(rpcToken);

  private readonly workbench = container.resolve(Workbench);

  private readonly explorer = container.resolve(Explorer);

  private cancelController?: AbortController;

  private parentId?: MaterialVO['parentId'];

  private readonly validateDuplicated = async (file: File) => {
    const hash = await getHash(await file.arrayBuffer());

    try {
      const materials = await this.remote.material.query.query(
        { fileHash: hash },
        { signal: this.cancelController?.signal },
      );
      return materials.length === 0;
    } catch {
      return false;
    }
  };

  @observable.ref public accessor form: ReturnType<CreationProcess['createForm']> | undefined;

  @action
  public start(parentId: MaterialVO['parentId']) {
    this.form = this.createForm();
    this.parentId = parentId;
    this.cancelController = new AbortController();
  }

  @action
  public cancel() {
    this.form = undefined;
    this.parentId = undefined;
    this.cancelController?.abort();
    this.cancelController = undefined;
  }

  private createForm() {
    return new Form({
      title: {
        validate: {
          schema: string(),
        },
      },
      body: {
        validate: {
          schema: string(),
        },
      },
      sourceUrl: {
        validate: {
          schema: string().url(),
          error: constant({ message: '必须是一个 URL', fatal: true }),
        },
      },
      file: {
        isRequired: true,
        validate: {
          schema: z.instanceof(File).refine(this.validateDuplicated),
        },
      },
      lang: {
        validate: {
          schema: string().array(),
        },
      },
    });
  }

  public readonly handleFileList = async (fileList: FileList | null) => {
    assert(this.form, 'no form');

    if (!fileList) {
      this.form.set('file', undefined);
      return;
    }

    const file = first(fileList);

    if (file) {
      this.form.set('file', file);

      if (!this.form.get('title')) {
        this.form.set('title', file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  public readonly submit = async () => {
    assert(this.form, 'no form');
    const result = this.form.getValues();
    assert(result, 'can not submit');

    const { file, lang, ...material } = result;
    assert(file, 'no file');

    const { id: fileId } = await this.remote.file.upload.mutate({
      path: file.path,
      mimeType: file.type,
      lang,
    });

    const newMaterial = await this.remote.material.create.mutate({
      ...material,
      fileId,
      parentId: this.parentId,
    });

    this.cancel();

    this.workbench.openEntity({
      entityType: EntityTypes.Material,
      entityId: newMaterial.id,
      mimeType: file.type,
    });

    this.explorer.tree.add(newMaterial);
    this.explorer.tree.reveal(newMaterial.id);
  };

  public readonly createDirectory = async (parentId: MaterialVO['parentId']) => {
    const directory = await this.remote.material.create.mutate({ parentId });
    this.explorer.tree.add(directory);
    this.explorer.rename.start(directory.id);
  };
}
