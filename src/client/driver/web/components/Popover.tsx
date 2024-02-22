import { type Placement, useClick, useDismiss, useFloating, useInteractions } from '@floating-ui/react';
import { type ReactNode, useState, forwardRef, useImperativeHandle } from 'react';

import { createPortal } from 'react-dom';
import { APP_CLASS_NAME } from '@web/infra/ui/constants';

export interface PopoverRef {
  dismiss: () => void;
}

interface Props {
  placement?: Placement;
  reference: ReactNode | ((params: { isOpen: boolean }) => ReactNode);
  children: ReactNode;
}

export default forwardRef<PopoverRef, Props>(function Popover({ reference, children, placement }, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, context, floatingStyles } = useFloating({
    open: isOpen,
    placement,
    onOpenChange: setIsOpen,
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context, { keyboardHandlers: false }),
    useDismiss(context),
  ]);
  const mountPoint = refs.domReference.current?.closest('dialog') || document.body;

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
          <div ref={refs.setFloating} {...getFloatingProps()} className={APP_CLASS_NAME} style={floatingStyles}>
            {children}
          </div>,
          mountPoint,
        )}
    </>
  );
});
