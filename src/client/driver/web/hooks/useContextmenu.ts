import { useEffect, useCallback } from 'react';
import { useLocalObservable } from 'mobx-react-lite';
import { observable } from 'mobx';

export default function useContextmenu() {
  const state = useLocalObservable(
    () => ({
      position: { x: 0, y: 0 },
      visible: false,
      openId: 0,
      open() {
        this.openId++;
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

  const handleMousemove = useCallback((e: MouseEvent) => {
    state.updatePosition({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    document.body.addEventListener('mousemove', handleMousemove);
    return () => document.body.removeEventListener('mousemove', handleMousemove);
  }, [handleMousemove, state.visible]);

  return state;
}

export type Contextmenu = ReturnType<typeof useContextmenu>;
