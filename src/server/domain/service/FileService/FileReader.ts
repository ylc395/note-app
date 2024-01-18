import fs from 'fs-extra';
import { getHash } from '@shared/utils/file.js';

export default class ElectronFileReader {
  async read(filePath: string) {
    const data = await fs.readFile(filePath);
    return data.buffer;
  }

  async getHash(data: ArrayBuffer) {
    return getHash(data);
  }
}
