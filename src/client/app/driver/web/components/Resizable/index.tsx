import { useRef, type ReactNode, useState } from 'react';
import throttle from 'lodash/throttle';
import Resizer, { type Props as ResizerProps } from './Resizer';

export interface Props {
  children: ReactNode;
  resizable: 'left' | 'right';
  className?: string;
  rootClassName?: string;
  initialWidth: number;
  minWidth?: number;
}

export default function Resizable({ children, className, initialWidth, minWidth = 0, resizable }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(initialWidth);
  const updateNode: ResizerProps['onResize'] = throttle((e) => {
    const { left, right } = divRef.current!.getBoundingClientRect();

    if (resizable === 'left') {
      const diff = Math.abs(e.clientX - left);
      setWidth(Math.max(width + (e.clientX < left ? diff : -diff), minWidth));
    }

    if (resizable === 'right') {
      const diff = Math.abs(e.clientX - right);
      setWidth(Math.max(width + (e.clientX > right ? diff : -diff), minWidth));
    }
  }, 24);

  return (
    <div ref={divRef} style={{ width }} className="relative">
      {resizable === 'left' && <Resizer direction="x" className="absolute inset-y-0 left-0" onResize={updateNode} />}
      <div className={className}>{children}</div>
      {resizable === 'right' && <Resizer direction="x" className="absolute inset-y-0 right-0" onResize={updateNode} />}
    </div>
  );
}
