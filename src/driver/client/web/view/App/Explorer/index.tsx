import { Match, Switch } from 'solid-js';
import { Splitter } from '@ark-ui/solid';
import container from '#utils/singletonContainer';

import TreeExplorer from '#domain/client/app/model/note/TreeExplorer';
import NoteExplorer from './Note';
import MemoExplorer from './Memo';
import UIState, { SidebarTabs } from '../UIState';
import { ContextProvider } from './Note/context';

export default function Explorer(props: { panelId: string }) {
  const uiState = container.resolve(UIState);
  const explorerClassName = 'border-r border-r-border-primary h-full flex flex-col p-3 bg-bg-secondary';

  const noteTreeExplorer = new TreeExplorer();

  return (
    <Splitter.Panel id={props.panelId}>
      <Switch>
        <Match when={uiState.explorer.type === SidebarTabs.Note}>
          <ContextProvider treeExplorer={noteTreeExplorer}>
            <NoteExplorer className={explorerClassName} />
          </ContextProvider>
        </Match>
        <Match when={uiState.explorer.type === SidebarTabs.Memo}>
          <MemoExplorer className={explorerClassName} />
        </Match>
      </Switch>
    </Splitter.Panel>
  );
}
