import { useFloating } from '@floating-ui/react';
import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useEffect } from 'react';

import ctx from './Context';
import { coverElementMiddleware } from 'components/floatingMiddleware';

export default observer(function ElementSelector() {
  const { clipService } = useContext(ctx);
  const { floatingStyles, refs } = useFloating({ middleware: coverElementMiddleware });
  const isEnabled = clipService.mode === 'element-select';

  const handleClick = useCallback(
    (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      if (e.target === refs.reference.current) {
        clipService.clipElement(e.target as HTMLElement);
      }
    },
    [clipService, refs.reference],
  );

  const handleHover = useCallback(
    (e: Event) => {
      refs.setReference(e.target as HTMLElement);
    },
    [refs],
  );

  const handleContextmenu = useCallback(
    (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      clipService.cancelByUser();
    },
    [clipService],
  );

  const handleKeyup = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clipService.cancelByUser();
      }
    },
    [clipService],
  );

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
