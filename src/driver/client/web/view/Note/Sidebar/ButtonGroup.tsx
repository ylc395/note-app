import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-solid';

import Workbench from '#domain/client/app/model/Workbench';
import container from '#utils/singletonContainer';
import { Direction } from '#domain/client/app/model/base/HistoryStack';

export default function ButtonGroup() {
  const { historyStack } = container.resolve(Workbench);
  const buttonClassName = 'join-item btn btn-xs btn-ghost btn-square';

  return (
    <div class="join">
      <button
        class={`${buttonClassName} ml-auto`}
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
