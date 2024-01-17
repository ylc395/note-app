import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useClickAway, useKeyPress, useCreation } from 'ahooks';
import clsx from 'clsx';
import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { createPortal } from 'react-dom';
import Form from '@domain/common/model/abstract/Form';

import ModalManager from '@domain/common/infra/ModalManager';
import { APP_CLASS_NAME } from '@web/infra/ui/constants';
import type { PromptToken } from '@shared/domain/infra/ui';

interface Props<T> {
  id: PromptToken<T>;
  children: ReactNode;
  title?: string;
  onToggle?: (visible: boolean) => void;
  width?: number;
  height?: number;
  modalClassName?: string;
  bodyClassName?: string;
  canConfirm?: boolean;
  getSubmitResult?: () => T;
}

export function useModalValue<T>(factory: () => T) {
  const [isOpen, setIsOpen] = useState(false);
  const value = useCreation(() => (isOpen ? factory() : undefined), [isOpen]);

  return {
    value,
    modalProps: {
      onToggle: setIsOpen,
      canConfirm: value instanceof Form ? value.isValid : undefined,
      getSubmitResult: value instanceof Form ? value.getValues : undefined,
    },
  };
}

export default observer(function Modal<T>({
  children,
  title,
  modalClassName,
  bodyClassName,
  width = 400,
  height = 300,
  onToggle,
  canConfirm = true,
  getSubmitResult,
  id,
}: Props<T>) {
  const modalManager = container.resolve(ModalManager);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const divRef = useRef<HTMLDivElement | null>(null);
  const { isOpen, submit, cancel } = modalManager.use(id);

  useEffect(() => {
    onToggle?.(isOpen);
  }, [isOpen, onToggle]);

  useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [isOpen]);

  useClickAway(() => isOpen && cancel(), divRef);
  useKeyPress('esc', () => isOpen && cancel());

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
              disabled={!canConfirm}
              onClick={() => submit(getSubmitResult?.())}
            >
              确&ensp;认
            </button>
            <button className="ml-2 h-8 w-16 cursor-pointer rounded border-0" onClick={cancel}>
              取&ensp;消
            </button>
          </div>
        </div>
      </dialog>
    </div>,
    document.body,
  ) as ReactNode;
});
