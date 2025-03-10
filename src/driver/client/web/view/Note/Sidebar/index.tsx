import { Splitter } from '@ark-ui/solid';
import TreeView from './TreeView';

export default function Sidebar(props: { panelId: string }) {
  return (
    <Splitter.Panel id={props.panelId} class="border-r h-full flex flex-col min-w-60 py-4 pl-4">
      <div>
        <h1>NOTE</h1>
      </div>
      <TreeView />
    </Splitter.Panel>
  );
}
