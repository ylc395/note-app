import { ArrowLeftIcon, ArrowRightIcon, PanelLeftClose } from 'lucide-solid';

import Workbench from '#domain/client/app/model/Workbench';
import { container } from '#domain/shared/infra/singletons';
import { Direction } from '#domain/client/app/model/Workbench/HistoryStack';

export default function ButtonGroup() {
  const { historyStack } = container.resolve(Workbench);
  const buttonClassName = 'text-gray-300';

  return (
    <>
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
      <button class={buttonClassName}>
        <PanelLeftClose />
      </button>
    </>
  );
}
