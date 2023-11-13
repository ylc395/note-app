import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title: string;
}

// eslint-disable-next-line mobx/missing-observer
export default function ExplorerHeader({ children, title }: Props) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h1 className="m-0 text-base">{title}</h1>
      {children}
    </div>
  );
}
