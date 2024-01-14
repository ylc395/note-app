import { type ReactNode, useEffect, useRef } from 'react';
import { useClickAway, useKeyPress } from 'ahooks';
import clsx from 'clsx';
import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { createPortal } from 'react-dom';

import ModalManager from '@domain/common/infra/ModalManager';
import { APP_CLASS_NAME } from '@web/infra/ui/constants';
import type { PromptToken } from '@shared/domain/infra/ui';

interface Props {
  id: PromptToken<unknown>;
  children: ReactNode;
  title?: string;
  onToggle?: (visible: boolean) => void;
  value?: unknown;
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
  onToggle,
  value,
  id,
}: Props) {
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

  useClickAway(() => isOpen && cancel, divRef);
  useKeyPress('esc', () => isOpen && cancel);

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
              disabled={typeof value === 'undefined'}
              onClick={() => submit(value)}
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
