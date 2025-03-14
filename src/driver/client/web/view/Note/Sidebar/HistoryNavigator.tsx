import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-solid';
import Workbench from '#domain/client/app/model/Workbench';
import { container } from '#domain/shared/infra/singletons';
import { Direction } from '#domain/client/app/model/Workbench/HistoryStack';

export default function HistoryNavigator() {
  const { historyStack } = container.resolve(Workbench);

  return (
    <div class="ml-auto w-fit">
      <button disabled={!historyStack.canBackward} onClick={() => historyStack.pop(Direction.BACKWARD)}>
        <ArrowLeftIcon />
      </button>
      <button disabled={!historyStack.canForward} onClick={() => historyStack.pop(Direction.FORWARD)}>
        <ArrowRightIcon />
      </button>
    </div>
  );
}
