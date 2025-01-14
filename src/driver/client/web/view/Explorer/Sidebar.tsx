import { Tabs } from '@ark-ui/solid/tabs';
import { BsJournal, BsLightbulb } from 'solid-icons/bs';

export default function Sidebar() {
  return (
    <Tabs.List class="flex flex-col h-screen bg-gray-100 relative">
      <Tabs.Trigger
        value="note"
        class="flex justify-center items-center h-14 w-14 border-0 bg-transparent cursor-pointer data-[selected]:bg-gray-200"
      >
        <BsJournal size="24" />
      </Tabs.Trigger>
      <Tabs.Trigger
        value="memo"
        class="flex justify-center items-center h-14 w-14 border-0 bg-transparent cursor-pointer data-[selected]:bg-gray-200"
      >
        <BsLightbulb size="24" />
      </Tabs.Trigger>
    </Tabs.List>
  );
}
