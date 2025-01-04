import { ArrowLeftIcon, ArrowRightIcon, SearchIcon, HistoryIcon } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { container } from '#domain/shared/infra/singletons';

import Button from '#web/components/Button';
import Workbench from '#domain/client/app/model/Workbench';
import { Direction } from '#domain/client/app/model/Workbench/HistoryStack';

export default observer(function BottomBar() {
  const { historyStack } = container.resolve(Workbench);

  return (
    <div className="py-2 border-0 border-b border-solid border-layout relative">
      <div className="flex space-x-2">
        <Button
          icon={<ArrowLeftIcon />}
          onClick={() => historyStack.pop(Direction.BACKWARD)}
          disabled={!historyStack.canBackward}
        />
        <Button
          icon={<ArrowRightIcon />}
          onClick={() => historyStack.pop(Direction.FORWARD)}
          disabled={!historyStack.canForward}
        />
        <Button icon={<HistoryIcon />} />
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 items-center rounded-md border border-solid border-layout px-2">
        <SearchIcon className="mr-2" />
        <input placeholder="搜索..." className="w-60 text-sm h-full border-none outline-none p-0" />
      </div>
    </div>
  );
});
