import { AiFillHighlight, AiOutlineComment } from 'react-icons/ai';
import { type Placement, autoUpdate, offset, useFloating } from '@floating-ui/react';

import Button from '@web/components/Button';

interface Props {
  reference: HTMLSpanElement | undefined;
  onHighlight: (color: string) => void;
  placement?: Placement;
}

// eslint-disable-next-line mobx/missing-observer
export default function SelectionTooltip({ reference, placement, onHighlight }: Props) {
  const { refs, floatingStyles } = useFloating({
    whileElementsMounted: autoUpdate,
    middleware: [offset(10)],
    elements: { reference },
    placement,
  });

  return (
    reference && (
      <div className="z-50 flex bg-gray-800 " ref={refs.setFloating} style={floatingStyles}>
        <Button className="text-white" onClick={() => onHighlight('yellow')}>
          <AiFillHighlight />
        </Button>
        <Button className="text-white">
          <AiOutlineComment />
        </Button>
      </div>
    )
  );
}
