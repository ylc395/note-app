import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-solid';
import { Direction } from '#domain/client/app/model/base/HistoryStack';
import type PdfViewer from '../PDFViewer';

export default function BackAndForward(props: { viewer: PdfViewer }) {
  return (
    <div class="flex items-center space-x-2 text-sm">
      <button onClick={() => props.viewer.historyStack.pop(Direction.BACKWARD)} class="flex items-center">
        <ArrowLeftIcon />
      </button>
      <button onClick={() => props.viewer.historyStack.pop(Direction.FORWARD)} class="flex items-center">
        <ArrowRightIcon />
      </button>
    </div>
  );
}
