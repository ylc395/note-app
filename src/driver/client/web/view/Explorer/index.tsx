import { createMemo, Match, Switch } from 'solid-js';
import { Splitter } from '@ark-ui/solid';
import container from '#utils/singletonContainer';

import NoteExplorer from './Note';
import MemoExplorer from './Memo';
import UIState, { SidebarTabs } from '../UIState';

export default function Explorer(props: { panelId: string }) {
  const uiState = container.resolve(UIState);
  const explorerType = createMemo(() => uiState.get('app.explorer'));
  const explorerClassName =
    'border-r border-r-border-secondary h-full flex flex-col p-inset-square-lg bg-surface-secondary';

  return (
    <Splitter.Panel id={props.panelId}>
      <Switch>
        <Match when={explorerType() === SidebarTabs.Note}>
          <NoteExplorer className={explorerClassName} />
        </Match>
        <Match when={explorerType() === SidebarTabs.Memo}>
          <MemoExplorer className={explorerClassName} />
        </Match>
      </Switch>
    </Splitter.Panel>
  );
}
