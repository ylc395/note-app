import { describe, it, before } from 'mocha';
import { strictEqual, deepStrictEqual, ok, rejects } from 'node:assert';
import MaterialsController from '../../dist/electron/server/controller/MaterialsController';
import RecyclablesController from '../../dist/electron/server/controller/RecyclablesController';
import FilesController from '../../dist/electron/server/controller/FilesController';
import { EntityTypes } from '../../dist/electron/shared/model/entity';
import {
  isDirectory,
  isEntityMaterial,
  MaterialDirectoryVO,
  MaterialVO,
} from '../../dist/electron/shared/model/material';

describe('materials', function () {
  let materialsController: MaterialsController;
  let fileController: FilesController;
  let recyclablesController: RecyclablesController;

  before(function () {
    materialsController = this.nestModule.get(MaterialsController);
    recyclablesController = this.nestModule.get(RecyclablesController);
    fileController = this.nestModule.get(FilesController);
  });

  let rootMaterials: MaterialVO[];

  it('should create some root materials', async function () {
    const files = await fileController.uploadFiles([{ data: Buffer.from('114514'), mimeType: 'text/plain' }]);

    rootMaterials = (await Promise.all([
      materialsController.create({}),
      materialsController.create({}),
      materialsController.create({ fileId: files[0]?.id }),
    ])) as MaterialVO[];

    for (const { id } of rootMaterials) {
      ok(typeof id === 'string');
    }
  });

  it('should has a normalized title (not empty) ', function () {
    ok(rootMaterials[1]?.name);
  });

  it('should query root materials', async function () {
    const materials = await materialsController.query({});
    ok(materials.length === 3);

    for (const material of rootMaterials) {
      deepStrictEqual(
        material,
        rootMaterials.find(({ id }) => id === material.id),
      );
    }
  });

  it('should query specified material by id, and fail for an invalid id', async function () {
    for (const material of rootMaterials) {
      deepStrictEqual(await materialsController.queryOne(material.id), material);
    }

    await rejects(materialsController.queryOne('a invalid id'));
  });

  it('materials should have correct type', function () {
    ok(isDirectory(rootMaterials[0]!));
    ok(isDirectory(rootMaterials[1]!));
    ok(isEntityMaterial(rootMaterials[2]!));
  });

  it('should create child materials', async function () {
    const parent = rootMaterials[0]!;
    const files = await fileController.uploadFiles([{ data: Buffer.from('114514'), mimeType: 'text/plain' }]);

    const directory = await materialsController.create({ parentId: parent.id });
    const entityMaterial = await materialsController.create({ parentId: parent.id, fileId: files[0]!.id });

    ok(isDirectory(directory));
    ok(isEntityMaterial(entityMaterial));
  });

  it('should fail when parentId/fileId is invalid for creating', async function () {
    await rejects(materialsController.create({ fileId: 'invalid' }));
    await rejects(materialsController.create({ parentId: 'invalid parent id' }));
  });

  it('should query children, and has the correct childrenCount', async function () {
    let parent = rootMaterials[0]!;
    parent = await materialsController.queryOne(parent.id);
    ok(isDirectory(parent) && parent.childrenCount === 2);

    const children = await materialsController.query({ parentId: parent.id });
    ok(children.length === parent.childrenCount);
  });
});
