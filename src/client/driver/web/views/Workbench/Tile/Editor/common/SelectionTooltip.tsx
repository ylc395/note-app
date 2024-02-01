import { type Placement, autoUpdate, offset, useFloating } from '@floating-ui/react';
import type { ReactNode } from 'react';

import Button from '@web/components/Button';

interface Props {
  reference: HTMLSpanElement;
  placement?: Placement;
  buttons: { icon: ReactNode; onClick: () => void }[];
}

// eslint-disable-next-line mobx/missing-observer
export default function SelectionTooltip({ reference, placement, buttons }: Props) {
  const { refs, floatingStyles } = useFloating({
    whileElementsMounted: autoUpdate,
    middleware: [offset(10)],
    elements: { reference },
    placement,
  });

  return (
    <div className="z-50 flex bg-gray-800 " ref={refs.setFloating} style={floatingStyles}>
      {buttons.map(({ icon, onClick }, i) => (
        <Button className="text-white" onClick={onClick} key={i}>
          {icon}
        </Button>
      ))}
    </div>
  );
}
