import { action } from 'mobx';

import Tabs from './Tabs';
import uiState from '../uiState';

export default function Sidebar() {
  return (
    <div
      onClick={action(() => (uiState.isMenuVisible = 'visible'))}
      class="z-10 inset-0 absolute lg:bg-transparent lg:static lg:mr-4"
      classList={{
        hidden: uiState.isMenuVisible !== 'alwaysVisible',
        'lg:hidden': uiState.isMenuVisible === 'invisible',
        'lg:flex': uiState.isMenuVisible !== 'invisible',
      }}
    >
      <div
        onclick={(e) => e.stopPropagation()}
        class="w-fit bg-gray-50 h-full border-r flex flex-col shadow-md pt-4 px-4
                lg:border-0 lg:shadow-none "
      >
        <div class="flex items-center mb-4 justify-between">
          <h2 class="font-semibold text-lg">MEMOS</h2>
        </div>
        <Tabs />
      </div>
    </div>
  );
}
