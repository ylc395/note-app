import { type ReactNode, useEffect, useRef } from 'react';
import { useClickAway, useKeyPress } from 'ahooks';
import clsx from 'clsx';
import { noop } from 'lodash-es';
import { createPortal } from 'react-dom';

import { APP_CLASS_NAME } from '@web/infra/ui/constants';

export interface Props {
  children: ReactNode;
  title?: string;
  width?: number;
  height?: number;
  bodyClassName?: string;
  visible?: boolean;
  canConfirm?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function Modal({
  children,
  title,
  bodyClassName,
  width = 400,
  height = 300,
  visible = true,
  onConfirm,
  onCancel,
  canConfirm = true,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (visible && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [visible]);

  onCancel = visible ? onCancel : noop;
  useClickAway(onCancel, dialogRef);
  useKeyPress('esc', onCancel);

  if (!visible) {
    return null;
  }

  return createPortal(
    <div className={APP_CLASS_NAME}>
      <dialog
        autoFocus
        ref={dialogRef}
        className="select-none overflow-visible rounded-lg border-0 backdrop:pointer-events-none"
      >
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
            onClick={onConfirm}
          >
            确&ensp;认
          </button>
          <button className="ml-2 h-8 w-16 cursor-pointer rounded border-0" onClick={onCancel}>
            取&ensp;消
          </button>
        </div>
      </dialog>
    </div>,
    document.body,
  ) as ReactNode;
}
