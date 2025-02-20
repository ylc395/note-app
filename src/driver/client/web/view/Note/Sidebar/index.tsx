import { Splitter } from '@ark-ui/solid';
import TreeView from './TreeView';

export default function Explorer() {
  return (
    <Splitter.Panel id="sidebar" class="border-r h-full flex flex-col min-w-60">
      <div>
        <h1>NOTE</h1>
      </div>
      <TreeView />
    </Splitter.Panel>
  );
}
