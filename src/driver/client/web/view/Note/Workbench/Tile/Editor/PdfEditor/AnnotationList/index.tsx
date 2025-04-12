import { createMemo, For } from 'solid-js';

import type PdfViewer from '../PDFViewer';
import Item from './Item';
import Settings from './Settings';
import Add from './Add';

export default function AnnotationList(props: { viewer: PdfViewer }) {
  const annotations = createMemo(() => {
    if (props.viewer.editor.uiState?.['annotation.native'] === false) {
      return props.viewer.editor.annotation.list.filter(({ isNative }) => !isNative);
    }

    return props.viewer.editor.annotation.list;
  });

  return (
    <div class="w-64 p-2 border-l flex flex-col">
      <div class="flex justify-between mb-2">
        <Add />
        <Settings viewer={props.viewer} />
      </div>
      <For fallback={<div class="grow flex items-center justify-center">暂无标注</div>} each={annotations()}>
        {(item) => <Item value={item} />}
      </For>
    </div>
  );
}
