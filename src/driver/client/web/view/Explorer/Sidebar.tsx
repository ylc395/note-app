import { Tabs } from '@ark-ui/solid/tabs';
import { BookTextIcon, LightbulbIcon, DatabaseIcon } from 'lucide-solid';

export default function Sidebar() {
  const triggerClass =
    'flex justify-center items-center h-14 w-14 border-0 bg-transparent cursor-pointer data-[selected]:bg-gray-200';

  return (
    <Tabs.List class="flex flex-col h-screen bg-gray-100 relative">
      <Tabs.Trigger value="material" class={triggerClass}>
        <DatabaseIcon size="24" />
      </Tabs.Trigger>
      <Tabs.Trigger value="memo" class={triggerClass}>
        <LightbulbIcon size="24" />
      </Tabs.Trigger>
      <Tabs.Trigger value="note" class={triggerClass}>
        <BookTextIcon size="24" />
      </Tabs.Trigger>
    </Tabs.List>
  );
}
