import { type ReactNode, useState, useEffect, useRef } from 'react';
import { useBoolean, useClickAway, useKeyPress } from 'ahooks';
import clsx from 'clsx';

interface Props {
  children: ReactNode;
  isOpen: boolean;
  title?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  canConfirm?: boolean;
  width?: number;
  height?: number;
  modalClassName?: string;
  bodyClassName?: string;
}

export function useModal() {
  const [isOpen, { setFalse: close, setTrue: open }] = useBoolean(false);

  return { isOpen, close, open };
}

export type Modal = ReturnType<typeof useModal>;

export default function ModalView({
  children,
  title,
  isOpen,
  modalClassName,
  bodyClassName,
  width = 400,
  height = 300,
  onCancel,
  onConfirm,
  canConfirm,
}: Props) {
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [dialog]);

  useClickAway(() => isOpen && onCancel?.(), divRef);
  useKeyPress('esc', () => isOpen && onCancel?.());

  return (
    isOpen && (
      <dialog ref={setDialog} className={clsx('select-none rounded-lg border-0', modalClassName)}>
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
              onClick={onConfirm}
            >
              确&ensp;认
            </button>
            {onCancel && (
              <button className="ml-2 h-8 w-16 cursor-pointer rounded border-0" onClick={onCancel}>
                取&ensp;消
              </button>
            )}
          </div>
        </div>
      </dialog>
    )
  );
}
