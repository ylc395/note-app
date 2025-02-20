import { Splitter } from '@ark-ui/solid/splitter';
import Sidebar from './Sidebar';
import Workbench from './Workbench';

export default function NoteTab() {
  return (
    <Splitter.Root
      class="h-screen p-4 w-full"
      defaultSize={[
        { id: 'sidebar', size: 20 },
        { id: 'workbench', size: 80 },
      ]}
    >
      <Splitter.Panel id="sidebar">
        <Sidebar />
      </Splitter.Panel>
      <Splitter.ResizeTrigger id="sidebar:workbench" class="w-1" />
      <Splitter.Panel id="workbench">
        <Workbench />
      </Splitter.Panel>
    </Splitter.Root>
  );
}
