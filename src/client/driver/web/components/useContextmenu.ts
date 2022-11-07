import { provide, type InjectionKey } from 'vue';
import { useConfirmDialog } from '@vueuse/core';

export default function useContextmenu() {
  const { reveal, confirm, isRevealed, cancel, onReveal, onConfirm } = useConfirmDialog();

  const composable = {
    confirm,
    cancel,
    isRevealed,
    onReveal,
    onConfirm,
  };

  const token: InjectionKey<typeof composable> = Symbol('useContextmenu');

  provide(token, composable);

  return { reveal, token };
}
