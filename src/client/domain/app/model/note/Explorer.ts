import { compact } from 'lodash-es';
import { singleton, container } from 'tsyringe';
import { token as rpcToken } from '@domain/common/infra/rpc';
import assert from 'assert';

import NoteTree from '@domain/common/model/note/Tree';
import type { NoteVO } from '@shared/domain/model/note';
import Explorer, { RenameBehavior } from '@domain/app/model/abstract/Explorer';
import { eventBus, Events as NoteEvents } from './eventBus';
import { EntityTypes } from '../entity';

export { EventNames, type ActionEvent } from '../abstract/Explorer';

@singleton()
export default class NoteExplorer extends Explorer<NoteVO> {
  constructor() {
    super('noteExplorer');
    eventBus.on(NoteEvents.Updated, this.updateNode, ({ actor }) => actor !== this);
  }
  public readonly entityType = EntityTypes.Note;
  public readonly tree = new NoteTree();
  private readonly remote = container.resolve(rpcToken);

  public readonly rename = new RenameBehavior({
    tree: this.tree,
    onSubmit: async ({ id, name }) => {
      const newNote = await this.remote.note.updateOne.mutate([id, { title: name }]);
      eventBus.emit(NoteEvents.Updated, { id: newNote.id, title: newNote.title, actor: this });
      return newNote;
    },
  });

  protected getContextmenu() {
    const isMultiple = this.tree.selectedNodes.length > 1;
    const oneNode = this.tree.selectedNodes[0];
    assert(oneNode);

    const canOpenInNewTab = !this.workbench.currentTile?.findByEntity(oneNode.entityLocator);

    return compact([
      isMultiple && { label: `共${this.tree.selectedNodes.length}项`, disabled: true },
      isMultiple && ({ type: 'separator' } as const),
      canOpenInNewTab && { label: '新标签页打开', key: 'openInNewTab' },
      this.workbench.currentTile && {
        label: '打开至...',
        submenu: [
          { label: '左边', key: 'openToLeft' },
          { label: '右边', key: 'openToRight' },
          { label: '上边', key: 'openToTop' },
          { label: '下边', key: 'openToBottom' },
        ],
      },
      { type: 'separator' } as const,
      { label: '移动至...', key: 'move' },
      { label: '重命名与选择图标', key: 'rename' },
      !isMultiple && { label: '制作副本', key: 'duplicate' },
      { type: 'separator' } as const,
      { label: '删除', key: 'delete' },
    ]);
  }
}
