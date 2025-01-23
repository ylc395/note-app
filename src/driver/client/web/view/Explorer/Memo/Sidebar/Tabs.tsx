import { Tabs as ArkTabs } from '@ark-ui/solid';

export default function Tabs() {
  return (
    <ArkTabs.List class="flex flex-col mt-10 items-start">
      <ArkTabs.Trigger value="memos" class="py-2 w-full text-start">
        Memo
      </ArkTabs.Trigger>
      <ArkTabs.Trigger value="stats" class="py-2 w-full text-start">
        统计
      </ArkTabs.Trigger>
      <ArkTabs.Trigger value="review" class="py-2 w-full text-start">
        回顾
      </ArkTabs.Trigger>
    </ArkTabs.List>
  );
}
