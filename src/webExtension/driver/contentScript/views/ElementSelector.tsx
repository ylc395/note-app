import { useFloating } from '@floating-ui/react';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { container } from 'tsyringe';
import { useMemoizedFn } from 'ahooks';

import { coverElementMiddleware } from 'components/floatingMiddleware';
import { TaskTypes } from 'model/task';
import PageService from 'service/PageService';

export default observer(function ElementSelector() {
  const clipService = container.resolve(PageService);
  const { floatingStyles, refs } = useFloating({ middleware: coverElementMiddleware });
  const isEnabled =
    clipService.activeTask &&
    !clipService.isLoading &&
    !clipService.activeTaskResult &&
    [TaskTypes.SelectElement, TaskTypes.SelectElementText].includes(clipService.activeTask.type);

  const handleClick = useMemoizedFn((e: Event) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    if (e.target === refs.reference.current) {
      clipService.clipElement(e.target as HTMLElement);
    }
  });

  const handleHover = useMemoizedFn((e: Event) => {
    refs.setReference(e.target as HTMLElement);
  });

  const handleContextmenu = useMemoizedFn((e: Event) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    clipService.cancelByUser();
  });

  const handleKeyup = useMemoizedFn((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      clipService.cancelByUser();
    }
  });

  useEffect(() => {
    if (isEnabled) {
      document.body.addEventListener('mouseover', handleHover);
      document.body.addEventListener('click', handleClick);
      document.body.addEventListener('contextmenu', handleContextmenu);
      document.body.addEventListener('keyup', handleKeyup);

      return () => {
        document.body.removeEventListener('mouseover', handleHover);
        document.body.removeEventListener('click', handleClick);
        document.body.removeEventListener('contextmenu', handleContextmenu);
        document.body.removeEventListener('keyup', handleKeyup);
      };
    }
  }, [handleClick, handleContextmenu, handleHover, handleKeyup, isEnabled]);

  return isEnabled ? (
    <div
      ref={refs.setFloating}
      className="pointer-events-none z-50 bg-blue-600 opacity-20"
      style={floatingStyles}
    ></div>
  ) : null;
});
