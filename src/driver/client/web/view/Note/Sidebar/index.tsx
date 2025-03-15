import { Splitter } from '@ark-ui/solid';

import TreeView from './TreeView';
import DropArea from './DropArea';
import ButtonGroup from './ButtonGroup';
import SearchBox from './SearchBox';

export default function Sidebar(props: { panelId: string }) {
  return (
    <Splitter.Panel id={props.panelId} class="border-r h-full flex flex-col min-w-60 py-4 pl-4">
      <div class="flex items-center mb-2 pr-2">
        <h1>NOTE</h1>
        <div class="relative grow h-full flex">
          <ButtonGroup />
          <DropArea />
        </div>
      </div>
      <SearchBox />
      <TreeView />
    </Splitter.Panel>
  );
}
