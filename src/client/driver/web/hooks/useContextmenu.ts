import { useEffect, useCallback, type ReactNode } from 'react';
import { useLocalObservable } from 'mobx-react-lite';
import { observable, action } from 'mobx';

export default function useContextmenu() {
  const state = useLocalObservable(
    () => ({
      position: { x: 0, y: 0 },
      visible: false,
      open() {
        this.visible = true;
      },
      close() {
        this.visible = false;
      },
      updatePosition(position: { x: number; y: number }) {
        this.position = position;
      },
    }),
    { position: observable.ref },
  );

  const handleMousemove = useCallback(
    action((e: MouseEvent) => {
      state.updatePosition({ x: e.clientX, y: e.clientY });
    }),
    [],
  );

  useEffect(() => {
    document.body.addEventListener('mousemove', handleMousemove);
    return () => document.body.removeEventListener('mousemove', handleMousemove);
  }, [handleMousemove, state.visible]);

  return state;
}

export type ContextmenuProps = ReturnType<typeof useContextmenu> & { children: ReactNode };
