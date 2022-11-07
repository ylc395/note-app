import { provide, type InjectionKey, nextTick } from 'vue';
import { useConfirmDialog } from '@vueuse/core';

export default function useContextmenu() {
  const { reveal: _reveal, confirm, isRevealed, cancel, onReveal } = useConfirmDialog();
  const reveal = () => nextTick(_reveal);

  const composable = {
    reveal,
    confirm,
    cancel,
    isRevealed,
    onReveal,
  };

  const token: InjectionKey<typeof composable> = Symbol('useContextmenu');

  provide(token, composable);

  return { reveal, token };
}
