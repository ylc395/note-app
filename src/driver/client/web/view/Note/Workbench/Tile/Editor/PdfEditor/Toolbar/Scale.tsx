import { ZoomInIcon, ZoomOutIcon } from 'lucide-solid';
import type PdfViewer from '../PDFViewer';

export default function Scale(props: { viewer: PdfViewer }) {
  return (
    <div class="flex items-center">
      <button onClick={() => props.viewer.setScale('down')}>
        <ZoomOutIcon />
      </button>
      <span class="mx-2">{props.viewer.scale.text}</span>
      <button onClick={() => props.viewer.setScale('up')}>
        <ZoomInIcon />
      </button>
    </div>
  );
}
