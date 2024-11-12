import { ArrowLeftIcon, ArrowRightIcon, SearchIcon, HistoryIcon } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import Button from '#web/components/Button';
import { Workbench } from '#domain/client/app/model/workbench';
import SearchService from '#domain/client/app/service/SearchService';

export default observer(function BottomBar() {
  const { historyManager } = container.resolve(Workbench);
  const { search } = container.resolve(SearchService);

  return (
    <div className="py-2 border-0 border-b border-solid border-layout relative">
      <div className="flex space-x-2">
        <Button
          icon={<ArrowLeftIcon />}
          onClick={() => historyManager.go('backward')}
          disabled={!historyManager.canBackward}
        />
        <Button
          icon={<ArrowRightIcon />}
          onClick={() => historyManager.go('forward')}
          disabled={!historyManager.canForward}
        />
        <Button icon={<HistoryIcon />} />
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 items-center rounded-md border border-solid border-layout px-2">
        <SearchIcon className="mr-2" />
        <input
          placeholder="搜索..."
          onChange={(e) => search({ keyword: e.target.value })}
          className="w-60 text-sm h-full border-none outline-none p-0"
        />
      </div>
    </div>
  );
});
