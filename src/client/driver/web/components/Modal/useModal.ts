import { useBoolean } from 'ahooks';

// todo: remove this
export default function useModal() {
  const [isOpen, { setFalse: close, setTrue: open }] = useBoolean(false);

  return { isOpen, close, open };
}
