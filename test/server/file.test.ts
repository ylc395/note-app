import { describe, it, before } from 'mocha';
import { ok, rejects } from 'node:assert';

import FilesController from '../../dist/electron/server/controller/FilesController';
import Context from '../../dist/electron/server/driver/electron/infra/IpcServer/Context';

const DEMO_ONLINE_IMAGE_URL =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg';
const DEMO_ONLINE_IMAGE_SIZE = 18122;
const DEMO_ONLINE_IMAGE_MIMETYPE = 'image/jpeg';

describe('files', function () {
  let fileController: FilesController;

  before(function () {
    fileController = this.nestModule.get(FilesController);
  });

  it("should fetch remote file's content, with correct content-type header", async function () {
    const ctx = new Context();
    const remoteFile = await fileController.getFileByUrl(DEMO_ONLINE_IMAGE_URL, ctx);
    const headers = ctx.getHeaders();

    ok(remoteFile);
    ok(headers['Content-Type'] === DEMO_ONLINE_IMAGE_MIMETYPE);
  });

  it('should fail when can not fetch remote file', async function () {
    const ctx = new Context();
    rejects(fileController.getFileByUrl('invalid url', ctx));
    rejects(fileController.getFileByUrl('https://www.baidu.com/invalid-path', ctx));
  });

  it('should upload file and then query it by id', async function () {
    const files = await fileController.uploadFiles([{ data: Buffer.from('1111'), mimeType: 'text/plain' }]);

    const id = files[0]!.id;
    const ctx = new Context();
    const file = await fileController.queryFile(id, ctx);
    const headers = ctx.getHeaders();

    ok(headers['Content-Type'] === 'text/plain');
    ok(file);
  });

  it('should fail when query invalid id', async function () {
    const ctx = new Context();
    await rejects(fileController.queryFile('invalid-id', ctx));
  });

  it('should upload file(s) on various ways, and get null for invalid payload', async function () {
    const filesPayload = [
      { url: DEMO_ONLINE_IMAGE_URL }, // by url
      { path: __filename, mimeType: 'text/javascript' }, // by file path
      { data: Buffer.from('12345678'), mimeType: 'text/plain' }, // by buffer/arraybuffer
      { url: 'invalid url' },
    ];
    const files = await fileController.uploadFiles(filesPayload);

    ok(files.length === filesPayload.length);
    ok(files[0]?.mimeType === DEMO_ONLINE_IMAGE_MIMETYPE);
    ok(files[0]?.size === DEMO_ONLINE_IMAGE_SIZE);
    ok(files[1]?.mimeType === 'text/javascript');
    ok(files[2]?.mimeType === 'text/plain');
    ok(files[2]?.size === 8);
    ok(files[3] === null);
  });

  it('should reuse file id for the same content', async function () {
    const files = await fileController.uploadFiles([
      { data: Buffer.from('114514'), mimeType: 'text/plain' },
      { data: Buffer.from('114514'), mimeType: 'text/plain' },
    ]);

    const files2 = await fileController.uploadFiles([{ data: Buffer.from('114514'), mimeType: 'text/plain' }]);

    const id = new Set<string>();
    for (const file of [...files, ...files2]) {
      id.add(file!.id);
    }

    ok(id.size === 1);
  });
});
