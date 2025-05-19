import { ListIcon, PenLineIcon, TextSearchIcon } from 'lucide-solid';
import { action } from 'mobx';
import assert from 'assert';

import type PdfViewer from '../PDFViewer';
import PageSwitcher from './PageSwitcher';
import Scale from './Scale';
import BackAndForward from './BackAndForward';

export default function Toolbar(props: { viewer: PdfViewer }) {
  function toggleOutlinePanel(value: 'text' | 'image') {
    assert(props.viewer.editor.uiState);
    props.viewer.editor.uiState['outline.type'] = props.viewer.editor.uiState['outline.type'] === value ? null : value;
  }

  function toggleAnnotationPanel() {
    assert(props.viewer.editor.uiState);
    props.viewer.editor.uiState['annotation.panel'] = !props.viewer.editor.uiState['annotation.panel'];
  }

  return (
    <div class="flex justify-between py-2 border-b px-2 relative">
      <div class="space-x-4 flex text-sm">
        <button onClick={action(() => toggleOutlinePanel('text'))} class="flex items-center">
          <ListIcon class="mr-1" />
          大纲
        </button>
        <Scale viewer={props.viewer} />
        <BackAndForward viewer={props.viewer} />
      </div>
      <div class="space-x-6 flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ">
        <PageSwitcher viewer={props.viewer} />
        <button onClick={() => props.viewer.searcher.toggle()}>
          <TextSearchIcon />
        </button>
      </div>
      <button onClick={action(toggleAnnotationPanel)} class="flex items-center text-sm">
        <PenLineIcon class="mr-1" />
        标注
      </button>
    </div>
  );
}
