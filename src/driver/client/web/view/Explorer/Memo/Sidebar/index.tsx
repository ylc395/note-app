import { action } from 'mobx';

import Calender from './Calender';
import Tabs from './Tabs';
import uiState from '../uiState';

export default function Sidebar() {
  return (
    <div
      onClick={action(() => (uiState.isMenuVisible = false))}
      class="z-10 inset-0 absolute lg:bg-transparent lg:static lg:block lg:mr-4"
      classList={{ hidden: !uiState.isMenuVisible }}
    >
      <div
        onclick={(e) => e.stopPropagation()}
        class="bg-white w-fit h-full border-r flex flex-col shadow-md pt-4 px-4
                lg:border-0 lg:w-auto  lg:shadow-none"
      >
        <Calender />
        <Tabs />
      </div>
    </div>
  );
}
