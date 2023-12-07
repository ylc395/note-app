import fs from 'fs-extra';

import type { SyncTarget } from '@domain/infra/synchronizer.js';

export default class FsSyncTarget implements SyncTarget {
  constructor(private readonly dir: string) {}

  async getFile(name: string) {
    const path = `${this.dir}/${name}`;

    if (!(await fs.pathExists(path))) {
      return null;
    }

    return fs.readFile(`${this.dir}/${name}`, { encoding: 'utf-8' });
  }

  putFile(name: string, content: string) {
    const path = `${this.dir}/${name}`;

    return fs.writeFile(path, content);
  }

  removeFile(name: string) {
    const path = `${this.dir}/${name}`;

    return fs.remove(path);
  }

  async empty() {
    await fs.emptyDir(this.dir);
  }

  async *list() {
    const files = await fs.readdir(this.dir);

    for (const file of files) {
      if (file.startsWith('.')) {
        continue;
      }

      yield fs.readFile(file, { encoding: 'utf-8' });
    }
  }
}
