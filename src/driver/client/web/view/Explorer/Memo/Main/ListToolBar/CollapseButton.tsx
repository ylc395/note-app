import { ArrowRightFromLineIcon, ArrowLeftFromLineIcon } from 'lucide-solid';
import { action } from 'mobx';

import uiState from '../../uiState';

export default function () {
  return (
    <>
      {/** 展开侧边栏按钮 */}
      <button
        class="mr-4"
        classList={{
          'lg:hidden': uiState.isMenuVisible !== 'invisible',
          hidden: uiState.isMenuVisible === 'alwaysVisible',
        }}
        onclick={action(() => (uiState.isMenuVisible = 'alwaysVisible'))}
      >
        <ArrowRightFromLineIcon />
      </button>
      {/** 收起侧边栏按钮 */}
      <button
        class="hidden mr-4"
        classList={{ 'lg:block': uiState.isMenuVisible !== 'invisible' }}
        onclick={action(() => (uiState.isMenuVisible = 'invisible'))}
      >
        <ArrowLeftFromLineIcon />
      </button>
    </>
  );
}
