import { type ReactNode, useEffect, useRef } from 'react';
import { useClickAway, useKeyPress } from 'ahooks';
import clsx from 'clsx';
import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { createPortal } from 'react-dom';

import ModalManager from '@domain/common/infra/ModalManager';
import { APP_CLASS_NAME } from '@web/infra/ui/constants';

interface Props {
  id: symbol;
  children: ReactNode;
  title?: string;
  onConfirm: () => boolean | Promise<boolean>;
  onCancel?: () => void;
  onToggle?: (visible: boolean) => void;
  canConfirm?: boolean;
  width?: number;
  height?: number;
  modalClassName?: string;
  bodyClassName?: string;
}

export default observer(function Modal({
  children,
  title,
  modalClassName,
  bodyClassName,
  width = 400,
  height = 300,
  onCancel,
  onConfirm,
  onToggle,
  canConfirm,
  id,
}: Props) {
  const modalManager = container.resolve(ModalManager);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const divRef = useRef<HTMLDivElement | null>(null);
  const isOpen = modalManager.currentModalId === id;
  const handleConfirm = async () => {
    const result = onConfirm();
    if (result instanceof Promise ? await result : result) {
      modalManager.close();
    }
  };

  const handleCancel = () => {
    onCancel?.();
    modalManager.close();
  };

  useEffect(() => {
    onToggle?.(isOpen);
  }, [isOpen, onToggle]);

  useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [isOpen]);

  useClickAway(() => isOpen && handleCancel(), divRef);
  useKeyPress('esc', () => isOpen && handleCancel());

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className={APP_CLASS_NAME}>
      <dialog ref={dialogRef} className={clsx('select-none rounded-lg border-0', modalClassName)}>
        <div ref={divRef}>
          {title && <h1 className="mt-0 text-lg">{title}</h1>}
          <div
            className={clsx('mb-4 overflow-auto', bodyClassName)}
            style={{ width: `${width}px`, height: `${height}px` }}
          >
            {children}
          </div>
          <div className="flex justify-end">
            <button
              className="h-8 w-16 cursor-pointer rounded border-0 bg-blue-100"
              disabled={typeof canConfirm === 'boolean' ? !canConfirm : undefined}
              onClick={handleConfirm}
            >
              确&ensp;认
            </button>
            <button className="ml-2 h-8 w-16 cursor-pointer rounded border-0" onClick={handleCancel}>
              取&ensp;消
            </button>
          </div>
        </div>
      </dialog>
    </div>,
    document.body,
  ) as ReactNode;
});
