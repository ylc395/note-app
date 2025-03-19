import { MinusIcon, PlusIcon } from 'lucide-solid';
import type PdfViewer from '../PDFViewer';

export default function Scale(props: { viewer: PdfViewer }) {
  return (
    <div>
      <button onClick={() => props.viewer.setScale('down')}>
        <MinusIcon />
      </button>
      {props.viewer.scale.text}
      <button onClick={() => props.viewer.setScale('up')}>
        <PlusIcon />
      </button>
    </div>
  );
}
