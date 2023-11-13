import { observer } from 'mobx-react-lite';
import type { ReactNode } from 'react';
import clsx from 'clsx';
import { container } from 'tsyringe';

import ExplorerService, { type ExplorerTypes } from 'service/ExplorerService';

interface Props {
  children: ReactNode;
  explorerType?: ExplorerTypes;
}

export default observer(function Button({ children, explorerType }: Props) {
  const { currentExplorer } = container.resolve(ExplorerService);

  return (
    <button
      className={clsx(
        explorerType === currentExplorer.value
          ? 'text-black before:absolute before:inset-y-0 before:left-0 before:h-full before:w-[2px] before:bg-black before:content-[""]'
          : 'text-gray-400',
        'relative w-full cursor-pointer border-0 bg-transparent py-3 text-2xl',
      )}
      onClick={explorerType && (() => currentExplorer.set(explorerType))}
    >
      {children}
    </button>
  );
});
