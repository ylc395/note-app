import { basename } from 'path';
import { readFile } from 'fs/promises';

import type { FileReader } from 'service/infra/FileReader';

export default class FsFileReader implements FileReader {
  read: FileReader['read'] = async (filePath) => {
    const name = basename(filePath);
    const data = await readFile(filePath);

    return { data, name };
  };
}
