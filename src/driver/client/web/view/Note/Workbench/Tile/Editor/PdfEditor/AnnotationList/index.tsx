import { createMemo, For } from 'solid-js';
import { negate } from 'lodash-es';

import AnnotationManager from '#domain/client/app/model/note/editor/PdfEditor/AnnotationManager';
import type PdfViewer from '../PDFViewer';
import Options from './Options';
import Item from './Item';

export default function AnnotationList(props: { viewer: PdfViewer }) {
  const annotations = createMemo(() => {
    if (props.viewer.editor.uiState?.['annotation.native'] === false) {
      return props.viewer.editor.annotation.list.filter(negate(AnnotationManager.isNative));
    }

    return props.viewer.editor.annotation.list;
  });

  return (
    <div class="w-64">
      <Options viewer={props.viewer} />
      <For each={annotations()}>{(item) => <Item value={item} />}</For>
    </div>
  );
}
