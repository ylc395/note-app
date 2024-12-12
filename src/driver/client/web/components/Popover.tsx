import {
  type Placement,
  type OffsetOptions,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  offset,
  arrow as arrowMiddleware,
  FloatingArrow,
} from '@floating-ui/react';
import { type ReactNode, useRef, useState, forwardRef, useImperativeHandle, ReactElement } from 'react';
import { createPortal } from 'react-dom';

import { APP_NAME } from '#domain/shared/infra/env';

export interface PopoverRef {
  dismiss: () => void;
}

interface Props {
  placement?: Placement;
  offset?: OffsetOptions;
  reference: ReactElement | ((params: { isOpen: boolean }) => ReactElement);
  arrow?: boolean;
  children: ReactNode;
}

export default forwardRef<PopoverRef, Props>(function Popover(
  { reference, children, placement, offset: offsetOptions, arrow },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);
  const { refs, context, floatingStyles } = useFloating({
    open: isOpen,
    placement,
    onOpenChange: setIsOpen,
    middleware: [offset(offsetOptions), arrowMiddleware({ element: arrowRef })],
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context, { keyboardHandlers: false }),
    useDismiss(context),
  ]);

  useImperativeHandle(ref, () => ({
    dismiss: () => setIsOpen(false),
  }));

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        {typeof reference === 'function' ? reference({ isOpen }) : reference}
      </div>
      {isOpen &&
        createPortal(
          <div ref={refs.setFloating} {...getFloatingProps()} className={APP_NAME} style={floatingStyles}>
            {arrow && <FloatingArrow ref={arrowRef} context={context} />}
            <div className="z-10">{children}</div>
          </div>,
          document.body,
        )}
    </>
  );
});
