import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-solid';
import { useContext } from '../context';

export default function BackAndForward() {
  const {
    viewer: { viewer },
  } = useContext()!;

  return (
    <div class="flex items-center space-x-2 text-sm">
      <button onClick={() => viewer.history?.back()} class="flex items-center">
        <ArrowLeftIcon />
      </button>
      <button onClick={() => viewer.history?.forward()} class="flex items-center">
        <ArrowRightIcon />
      </button>
    </div>
  );
}
