import { PanelLeftClose } from 'lucide-solid';

import container from '#utils/singletonContainer';
import Calender from './Calendar';
import UIState from '#web/view/App/UIState';

export default function Sidebar() {
  return (
    <div
      class="z-10 inset-0 bg-transparent absolute min-w-0 shrink-0 border-r p-4 opacity-80
        md:static md:z-0 md:opacity-100"
    >
      <div
        onclick={(e) => e.stopPropagation()}
        class="w-fit h-full overflow-auto shadow-md bg-bg-secondary p-4 md:shadow-none md:p-0 flex flex-col relative"
      >
        <div class="flex sticky z-10 bg-bg-secondary top-0 items-center pb-4 justify-between">
          <h1 class="font-semibold">MEMO</h1>
          <button class="text-fg-tertiary">
            <PanelLeftClose />
          </button>
        </div>
        {/* <Calender /> */}
      </div>
    </div>
  );
}
