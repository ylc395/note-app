import type { MouseEventHandler, ReactNode } from 'react';

// eslint-disable-next-line mobx/missing-observer
export default function IconButton({ icon, onClick }: { icon: ReactNode; onClick: MouseEventHandler }) {
  return <button onClick={onClick}>{icon}</button>;
}
