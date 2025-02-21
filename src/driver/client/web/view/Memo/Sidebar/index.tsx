import { action } from 'mobx';
import { PanelLeftClose } from 'lucide-solid';

import { container } from '#domain/shared/infra/singletons';
import Calender from './Calendar';
import TopicList from './TopicList';
import SearchBox from './SearchBox';
import LinkSelector from './LinkSelector';
import UIState from '#web/view/UIState';

export default function Sidebar() {
  const uiState = container.resolve(UIState);

  return (
    <div
      onclick={action(() => uiState.set('memo.sidebarVisibility', 'visible'))}
      class={`${uiState.get('memo.sidebarVisibility') === 'always' ? '' : 'hidden'}
        ${uiState.get('memo.sidebarVisibility') === 'hidden' ? 'md:hidden' : 'md:block'}
        z-10 inset-0 bg-transparent absolute min-w-0 shrink-0 border-r pr-4 mr-4 opacity-80
        md:static md:z-0 md:opacity-100`}
    >
      <div
        onclick={(e) => e.stopPropagation()}
        class="w-fit h-full overflow-auto shadow-md bg-gray-50 p-4 md:shadow-none md:p-0 flex flex-col relative"
      >
        <div class="flex sticky z-10 bg-gray-50 top-0 items-center pb-4 justify-between">
          <h1 class="font-semibold">MEMO</h1>
          <button class="text-gray-300" onClick={action(() => uiState.set('memo.sidebarVisibility', 'hidden'))}>
            <PanelLeftClose />
          </button>
        </div>
        <SearchBox />
        <Calender />
        <LinkSelector />
        <TopicList />
      </div>
    </div>
  );
}
