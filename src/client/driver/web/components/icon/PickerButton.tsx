import { MdOutlineAddReaction } from 'react-icons/md';
import { useRef } from 'react';
import Picker from './Picker';
import Icon from './Icon';
import Popover, { PopoverRef } from '../Popover';
import Button from '../Button';

interface Props {
  icon: string | null;
  onSelect: (icon: string | null) => void;
}

export default function PickerButton({ icon, onSelect }: Props) {
  const popoverRef = useRef<PopoverRef | null>(null);
  const _onSelect = async (icon: string | null) => {
    await onSelect(icon);
    popoverRef.current?.dismiss();
  };

  return (
    <Popover
      ref={popoverRef}
      placement="bottom-start"
      reference={({ isOpen }) => (
        <Button selected={isOpen} className="mr-1 h-8">
          <Icon size="1.2em" code={icon} fallback={<MdOutlineAddReaction size="1.2em" className="text-gray-400" />} />
        </Button>
      )}
    >
      <Picker canClear={Boolean(icon)} onSelect={_onSelect} />
    </Popover>
  );
}
