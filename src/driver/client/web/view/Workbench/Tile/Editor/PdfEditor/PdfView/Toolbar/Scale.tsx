import { ZoomInIcon, ZoomOutIcon } from 'lucide-solid';
import { useContext } from '../context';

export default function Scale() {
  const {
    viewer: { viewer },
  } = useContext()!;

  return (
    <div class="flex items-center">
      <button onClick={() => viewer.setScale('down')}>
        <ZoomOutIcon />
      </button>
      <span class="mx-2">{viewer.scale?.text}</span>
      <button onClick={() => viewer.setScale('up')}>
        <ZoomInIcon />
      </button>
    </div>
  );
}
