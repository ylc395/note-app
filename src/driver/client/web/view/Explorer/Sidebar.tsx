import { Tabs } from '@ark-ui/solid/tabs';
import { BookTextIcon, LightbulbIcon, HashIcon, SearchIcon, StarIcon, RecycleIcon, SettingsIcon } from 'lucide-solid';

export default function Sidebar() {
  const triggerClass =
    'flex justify-center items-center h-14 w-14 border-0 bg-transparent cursor-pointer data-[selected]:bg-gray-200';

  return (
    <Tabs.List class="flex flex-col h-screen bg-gray-100 relative">
      <div class="border-b">
        <Tabs.Trigger value="memo" class={triggerClass}>
          <LightbulbIcon size="24" />
        </Tabs.Trigger>
        <Tabs.Trigger value="note" class={triggerClass}>
          <BookTextIcon size="24" />
        </Tabs.Trigger>
      </div>
      <div>
        <button class={triggerClass}>
          <StarIcon />
        </button>
        <button class={triggerClass}>
          <HashIcon />
        </button>
        <button class={triggerClass}>
          <SearchIcon />
        </button>
      </div>
      <div class="mt-auto">
        <button class={triggerClass}>
          <RecycleIcon />
        </button>
        <button class={triggerClass}>
          <SettingsIcon />
        </button>
      </div>
    </Tabs.List>
  );
}
