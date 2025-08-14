import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-solid';

import Workbench from '#domain/client/app/model/Workbench';
import container from '#utils/singletonContainer';
import { Direction } from '#domain/client/app/model/base/HistoryStack';

export default function HistoryNavigationButtonGroup() {
  const { historyStack } = container.resolve(Workbench);
  const buttonClassName = 'button button-square-md';

  return (
    <div class="space-x-1 flex items-center">
      <button
        class={buttonClassName}
        disabled={!historyStack.canBackward}
        onClick={() => historyStack.pop(Direction.BACKWARD)}
      >
        <ArrowLeftIcon />
      </button>
      <button
        class={buttonClassName}
        disabled={!historyStack.canForward}
        onClick={() => historyStack.pop(Direction.FORWARD)}
      >
        <ArrowRightIcon />
      </button>
    </div>
  );
}
