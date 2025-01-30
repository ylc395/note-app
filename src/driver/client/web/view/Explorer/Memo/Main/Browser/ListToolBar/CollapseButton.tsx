import { ArrowRightFromLineIcon, ArrowLeftFromLineIcon } from 'lucide-solid';
import { action } from 'mobx';

import uiState from '../../../uiState';

export default function () {
  return (
    <>
      {/** 展开侧边栏按钮 */}
      <button
        class="mr-4 text-gray-400"
        classList={{
          'lg:hidden': uiState.tabVisibility !== 'invisible',
          hidden: uiState.tabVisibility === 'alwaysVisible',
        }}
        onclick={action(() => (uiState.tabVisibility = 'alwaysVisible'))}
      >
        <ArrowRightFromLineIcon />
      </button>
      {/** 收起侧边栏按钮 */}
      <button
        class="hidden mr-4 text-gray-400"
        classList={{ 'lg:block': uiState.tabVisibility !== 'invisible' }}
        onclick={action(() => (uiState.tabVisibility = 'invisible'))}
      >
        <ArrowLeftFromLineIcon />
      </button>
    </>
  );
}
