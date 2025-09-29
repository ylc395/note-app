import { createMemo, Match, Switch } from 'solid-js';
import { Splitter } from '@ark-ui/solid';
import container from '#utils/singletonContainer';

import NoteExplorer from './Note';
import MemoExplorer from './Memo';
import UIState, { SidebarTabs } from '../UIState';

export default function Explorer(props: { panelId: string }) {
  const uiState = container.resolve(UIState);
  const explorerType = createMemo(() => uiState.get('app.explorer'));

  return (
    <Splitter.Panel id={props.panelId} class="flex flex-col">
      <Switch>
        <Match when={explorerType() === SidebarTabs.Note}>
          <NoteExplorer />
        </Match>
        <Match when={explorerType() === SidebarTabs.Memo}>
          <MemoExplorer />
        </Match>
      </Switch>
    </Splitter.Panel>
  );
}
