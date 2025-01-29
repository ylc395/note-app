import { Tabs as ArkTabs } from '@ark-ui/solid';
import { ListIcon, ChartAreaIcon, BrainCircuitIcon } from 'lucide-solid';

export default function Tabs() {
  const triggerClassName =
    'flex items-center py-2 rounded-md px-4 w-full text-start text-gray-500 data-[selected]:bg-gray-400 data-[selected]:text-white';

  return (
    <ArkTabs.List class="flex flex-col mt-4 items-start round w-44 xl:w-64">
      <ArkTabs.Trigger value="memos" class={triggerClassName}>
        <ListIcon class="mr-2" />
        浏览
      </ArkTabs.Trigger>
      <ArkTabs.Trigger value="stats" class={triggerClassName}>
        <ChartAreaIcon class="mr-2" />
        统计
      </ArkTabs.Trigger>
      <ArkTabs.Trigger value="review" class={triggerClassName}>
        <BrainCircuitIcon class="mr-2" />
        回顾
      </ArkTabs.Trigger>
    </ArkTabs.List>
  );
}
