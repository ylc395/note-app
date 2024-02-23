import { singleton, container } from 'tsyringe';
import { token as rpcToken } from '@domain/common/infra/rpc';
import { compact } from 'lodash-es';

import NoteTree from '@domain/common/model/note/Tree';
import type { NoteVO } from '@shared/domain/model/note';
import Explorer, { RenameBehavior } from '@domain/app/model/abstract/Explorer';
import { eventBus, Events as NoteEvents } from './eventBus';
import { EntityTypes } from '../entity';
import ContextmenuBehavior from '../abstract/Explorer/ContextmenuBehavior';
import assert from 'assert';

@singleton()
export default class NoteExplorer extends Explorer<NoteVO> {
  constructor() {
    super();
    this.contextmenu = new ContextmenuBehavior({
      explorer: this,
      getItems: this.getContextmenuItems,
      handleAction: (e) => eventBus.emit(NoteEvents.Action, e),
    });
    this.rename = new RenameBehavior({ onSubmit: this.submitRename });
    eventBus.on(NoteEvents.Updated, this.handleEntityUpdate);
  }
  public readonly entityType = EntityTypes.Note;
  public readonly contextmenu: ContextmenuBehavior;
  public readonly tree = new NoteTree();
  private readonly remote = container.resolve(rpcToken);
  public readonly rename: RenameBehavior;

  private readonly submitRename = async ({ id, name }: { id: string; name: string }) => {
    await this.remote.note.updateOne.mutate([id, { title: name }]);
    eventBus.emit(NoteEvents.Updated, { id, title: name, trigger: this });
  };

  private readonly getContextmenuItems = () => {
    const isMultiple = this.tree.selectedNodes.length > 1;
    const node = this.tree.getSelectedNode();
    const canOpenInNewTab = !this.workbench.currentTile?.findByEntity(node.entityLocator);

    assert(node.entity);

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
      { label: '重命名', key: 'rename' },
      !isMultiple && { label: '制作副本', key: 'duplicate' },
      !isMultiple && node.entity && { label: node.entity.isStar ? '取消收藏' : '收藏', key: 'star' },
      { type: 'separator' } as const,
      { label: '删除', key: 'delete' },
    ]);
  };
}
