import { Splitter } from '@ark-ui/solid';

import TreeView from './TreeView';
import DropArea from './DropArea';
import HistoryNavigator from './HistoryNavigator';

export default function Sidebar(props: { panelId: string }) {
  return (
    <Splitter.Panel id={props.panelId} class="border-r h-full flex flex-col min-w-60 py-4 pl-4">
      <div class="flex items-center mb-2">
        <h1>NOTE</h1>
        <div class="relative grow h-full">
          <DropArea />
          <HistoryNavigator />
        </div>
      </div>
      <TreeView />
    </Splitter.Panel>
  );
}
