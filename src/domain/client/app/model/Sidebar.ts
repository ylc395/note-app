import { action, observable } from 'mobx';
import { z } from 'zod';

import UIState from './common/UIState';

enum SidebarContents {
  NoteExplorer,
  MemoExplorer,
  TopicExplorer,
  Search,
}

export default class Sidebar {
  constructor() {
    this.switchTo(this.uiState.value?.current || SidebarContents.NoteExplorer);
  }

  private readonly uiState = new UIState('sidebar', z.object({ current: z.nativeEnum(SidebarContents) }));

  @observable private accessor current!: SidebarContents;

  @action.bound
  public switchTo(current: SidebarContents) {
    if (current === this.current) {
      return;
    }

    this.current = current;
    this.uiState.update({ current });
  }

  public static readonly Contents = SidebarContents;
}
