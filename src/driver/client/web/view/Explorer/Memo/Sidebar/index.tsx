import { action } from 'mobx';
import { PanelLeftClose } from 'lucide-solid';

import Calender from './Calendar';
import TopicList from './TopicList';
import SearchBox from './SearchBox';
import LinkSelector from './LinkSelector';
import uiState from '../uiState';

export default function Sidebar() {
  return (
    <div
      onclick={action(() => (uiState.sidebarVisibility = 'visible'))}
      class={`${uiState.sidebarVisibility === 'always' ? 'flex' : 'hidden'}
        ${uiState.sidebarVisibility === 'hidden' ? 'md:hidden' : 'md:flex'}
        z-10 inset-0 bg-transparent absolute min-w-0 shrink-0 border-r pr-4 mr-4 opacity-80
        md:static md:z-0 md:opacity-100`}
    >
      <div onclick={(e) => e.stopPropagation()} class="shadow-md bg-gray-50 p-4 md:shadow-none md:p-0 flex flex-col">
        <div class="flex items-center mb-4 justify-between">
          <h1 class="font-semibold">MEMO</h1>
          <button class="text-gray-300" onClick={action(() => (uiState.sidebarVisibility = 'hidden'))}>
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
