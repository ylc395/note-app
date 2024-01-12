import fs from 'fs-extra';

export default class ElectronFileReader {
  async read(filePath: string) {
    const data = await fs.readFile(filePath);
    return data.buffer;
  }
}
