import { Placement, useClick, useDismiss, useFloating, useInteractions } from '@floating-ui/react';
import { type ReactNode, useState, forwardRef, useImperativeHandle } from 'react';

import Button from './Button';
import { createPortal } from 'react-dom';
import { APP_CLASS_NAME } from '@web/infra/ui/constants';

export interface PopoverRef {
  dismiss: () => void;
}

interface Props {
  className?: string;
  buttonContent: ReactNode;
  children: ReactNode;
  placement: Placement;
}

export default forwardRef<PopoverRef, Props>(function ButtonPopover(
  { className, buttonContent, placement, children },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, context, floatingStyles } = useFloating({
    open: isOpen,
    placement,
    onOpenChange: setIsOpen,
  });
  const click = useClick(context, { keyboardHandlers: false });
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);
  const mountPoint = refs.domReference.current?.closest('dialog') || document.body;

  useImperativeHandle(ref, () => ({
    dismiss: () => setIsOpen(false),
  }));

  return (
    <>
      <Button selected={isOpen} className={className} ref={refs.setReference} {...getReferenceProps()}>
        {buttonContent}
      </Button>
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
