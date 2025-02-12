import { action } from 'mobx';

import Calender from './Calendar';
import TopicList from './TopicList';
import SearchBox from './SearchBox';
import uiState from '../uiState';

export default function Sidebar() {
  return (
    <div
      onclick={action(() => (uiState.selectorVisibility = 'visible'))}
      class={`${uiState.selectorVisibility === 'always' ? 'flex' : 'hidden'}
        z-10 inset-0 justify-end bg-transparent absolute min-w-0 shrink-0 border-r pr-4 mr-4
        md:static md:z-0 md:flex`}
    >
      <div onclick={(e) => e.stopPropagation()} class="shadow-md bg-gray-50 p-4 md:shadow-none md:p-0 flex flex-col">
        <SearchBox />
        <Calender />
        <TopicList />
      </div>
    </div>
  );
}
