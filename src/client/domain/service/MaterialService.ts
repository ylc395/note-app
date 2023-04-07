import { singleton, container } from 'tsyringe';

import type { DirectoryDTO, DirectoryVO } from 'interface/material';
import { token as remoteToken } from 'infra/Remote';
// import Tree from 'model/material/Tree';

@singleton()
export default class MaterialService {
  private readonly remote = container.resolve(remoteToken);
  // readonly directoryTree = new Tree({
  //   fetchChildren(noteId) {

  //   },
  // });
  async createDirectory(parent?: DirectoryVO) {
    const { body: directory } = await this.remote.post<DirectoryDTO, DirectoryVO>(
      '/materials/directories',
      parent ? { parentId: parent.id } : {},
    );
  }
}
