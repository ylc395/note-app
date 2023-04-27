import { pathExists, readFile, writeFile, remove, emptyDir, readdir } from 'fs-extra';

import type { SyncTarget } from 'infra/SyncTargetFactory';

export default class FsSyncTarget implements SyncTarget {
  constructor(private readonly dir: string) {}

  async getFile(name: string) {
    const path = `${this.dir}/${name}`;

    if (!(await pathExists(path))) {
      return null;
    }

    return readFile(`${this.dir}/${name}`, { encoding: 'utf-8' });
  }

  putFile(name: string, content: string) {
    const path = `${this.dir}/${name}`;

    return writeFile(path, content);
  }

  removeFile(name: string) {
    const path = `${this.dir}/${name}`;

    return remove(path);
  }

  empty() {
    return emptyDir(this.dir);
  }

  async *list() {
    const files = await readdir(this.dir);

    for (const file of files) {
      if (file.startsWith('.')) {
        continue;
      }

      yield readFile(file, { encoding: 'utf-8' });
    }
  }
}
