import { Splitter } from '@ark-ui/solid';

import TreeView from './TreeView';
import DropArea from './DropArea';
import ButtonGroup from './ButtonGroup';
import SearchBox from './SearchBox';

export default function Sidebar(props: { panelId: string }) {
  return (
    <Splitter.Panel id={props.panelId} class="border-r h-full flex flex-col min-w-60 p-3">
      <div class="flex items-center mb-3">
        <h1 class="font-bold">笔记</h1>
        <div class="relative grow h-full flex justify-end">
          <ButtonGroup />
          <DropArea />
        </div>
      </div>
      <SearchBox />
      <TreeView />
    </Splitter.Panel>
  );
}
