import { type ReactNode, useRef, useEffect } from 'react';
import { useBoolean } from 'ahooks';

interface Props {
  children: ReactNode;
  isOpen: boolean;
  title?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  canConfirm?: boolean;
}

export function useModal() {
  const [isOpen, { setFalse: close, setTrue: open }] = useBoolean(false);

  return { isOpen, close, open };
}

export type Modal = ReturnType<typeof useModal>;

export default function ModalView({ children, title, isOpen, onCancel, onConfirm, canConfirm }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current!.showModal();
    } else {
      dialogRef.current!.close();
    }
  }, [isOpen]);

  return (
    <dialog ref={dialogRef}>
      {title && <h1>{title}</h1>}
      {isOpen && <div>{children}</div>}
      <div>
        <button disabled={typeof canConfirm === 'boolean' ? !canConfirm : undefined} onClick={onConfirm}></button>
        {onCancel && <button onClick={onCancel}>取消</button>}
      </div>
    </dialog>
  );
}
