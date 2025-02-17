import { Tabs } from '@ark-ui/solid';
import { DatabaseIcon, NotepadTextIcon } from 'lucide-solid';

export default function Explorer() {
  return (
    <div>
      <div>
        <h1>NOTE</h1>
      </div>
      <Tabs.Root orientation="horizontal" lazyMount>
        <Tabs.List class="flex">
          <Tabs.Trigger class="flex items-center" value="note">
            <NotepadTextIcon />
            笔记
          </Tabs.Trigger>
          <Tabs.Trigger class="flex items-center" value="material">
            <DatabaseIcon />
            素材
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="note"></Tabs.Content>
        <Tabs.Content value="material"></Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
