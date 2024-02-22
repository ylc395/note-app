import { observer } from 'mobx-react-lite';
import { forwardRef, type ReactNode } from 'react';
import clsx from 'clsx';
import { container } from 'tsyringe';

import ExplorerManager, { type ExplorerTypes } from '@domain/app/model/ExplorerManager';

interface Props {
  children: ReactNode;
  explorerType?: ExplorerTypes;
}

export default observer(
  // eslint-disable-next-line mobx/missing-observer
  forwardRef<HTMLButtonElement, Props>(function Button({ children, explorerType }, ref) {
    const { currentExplorerType, switchTo } = container.resolve(ExplorerManager);

    return (
      <button
        ref={ref}
        className={clsx(
          explorerType === currentExplorerType
            ? 'text-black before:absolute before:inset-y-0 before:left-0 before:h-full before:w-[2px] before:bg-black before:content-[""]'
            : 'text-gray-400',
          'relative w-full cursor-pointer border-0 bg-transparent py-3 text-2xl',
        )}
        onClick={explorerType && (() => switchTo(explorerType))}
      >
        {children}
      </button>
    );
  }),
);
