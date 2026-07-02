import { PanelLeftClose } from 'lucide-solid';

import container from '#utils/singletonContainer';
import Calender from './Calendar';
import Button from '#web/view/components/Button';
import UIState from '#web/view/App/UIState';

export default function Sidebar() {
  return (
    <div
      class="z-10 inset-0 bg-transparent absolute min-w-0 shrink-0 border-r border-border-primary p-4
        md:static md:z-0"
    >
      <div
        onclick={(e) => e.stopPropagation()}
        class="w-fit h-full overflow-auto shadow-md bg-surface-raised p-4 rounded-lg
          md:shadow-none md:p-0 md:rounded-none flex flex-col relative"
      >
        <div class="flex sticky z-10 bg-surface-raised top-0 items-center pb-4 justify-between">
          <h1 class="font-semibold text-fg-primary tracking-wide">MEMO</h1>
          <Button square size="small">
            <PanelLeftClose />
          </Button>
        </div>
        {/* <Calender /> */}
      </div>
    </div>
  );
}
