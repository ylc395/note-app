import { ZoomInIcon, ZoomOutIcon } from 'lucide-solid';
import Button from '#web/view/components/Button';
import { useContext } from '../context';

export default function Scale() {
  const {
    viewer: { viewer },
  } = useContext()!;

  return (
    <div class="flex items-center">
      <Button size="small" square onClick={() => viewer.setScale('down')}>
        <ZoomOutIcon />
      </Button>
      <span class="mx-1">{viewer.scale?.text}</span>
      <Button size="small" square onClick={() => viewer.setScale('up')}>
        <ZoomInIcon />
      </Button>
    </div>
  );
}
