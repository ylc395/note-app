import { onCleanup, onMount, Show } from 'solid-js';
import { MessageSquareMoreIcon, PaintbrushIcon } from 'lucide-solid';

import CommentInput from './CommentInput';
import ColorPicker from './ColorPicker';
import type PdfViewer from '../PDFViewer';
import Selection from './Selection';

export default function SelectionTooltip(props: { pdfViewer: PdfViewer }) {
  let rootEl: HTMLDivElement | undefined;
  const selection = new Selection(props.pdfViewer);

  onMount(() => {
    selection.activate(rootEl!);
  });

  onCleanup(() => {
    selection.deactivate();
  });

  return (
    <div ref={rootEl} class="absolute">
      <Show when={selection.isVisible}>
        <div class="flex space-x-2 bg-white py-2 px-1 rounded shadow-md z-50">
          <ColorPicker selection={selection} />
          <button class="flex items-center" onClick={() => selection.highlight()}>
            <PaintbrushIcon />
          </button>
          <button onClick={() => selection.openCommentEditor()} class="flex items-center">
            <MessageSquareMoreIcon />
          </button>
        </div>
      </Show>
      <Show when={selection.commentEditor}>
        <CommentInput selection={selection} />
      </Show>
    </div>
  );
}
