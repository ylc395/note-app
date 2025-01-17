import { action } from 'mobx';

import Calender from './Calender';
import uiState from '../uiState';

export default function Sidebar() {
  return (
    <div
      onClick={action(() => (uiState.isMenuVisible = false))}
      class="z-10 inset-0 absolute lg:bg-transparent lg:static lg:block"
      classList={{ hidden: !uiState.isMenuVisible }}
    >
      <div onclick={(e) => e.stopPropagation()} class="bg-white w-56 h-full border-r lg:border-0">
        <Calender />
      </div>
    </div>
  );
}
