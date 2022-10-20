import { basename } from 'path';
import { createReadStream, readFile } from 'fs-extra';
import { createHash } from 'crypto';

import type { FileReader } from 'infra/FileReader';

export default class FsFileReader implements FileReader {
  read: FileReader['read'] = async (filePath) => {
    const name = basename(filePath);
    const data = await readFile(filePath);
    const hash = await new Promise<string>((resolve) => {
      const hashStream = createReadStream(filePath).pipe(createHash('md5').setEncoding('hex'));
      hashStream.on('finish', () => resolve(hashStream.read()));
    });

    return { data, name, hash };
  };
}
