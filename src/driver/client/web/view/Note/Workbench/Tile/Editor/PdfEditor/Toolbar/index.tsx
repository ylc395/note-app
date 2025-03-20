import { BlocksIcon, ListIcon, PenLineIcon } from 'lucide-solid';
import { action } from 'mobx';

import type PdfViewer from '../PDFViewer';
import PageSwitcher from './PageSwitcher';
import Scale from './Scale';
import BackAndForward from './BackAndForward';

export default function Toolbar(props: { viewer: PdfViewer }) {
  function toggleOutlinePanel(value: 'text' | 'image') {
    props.viewer.editor.uiState.outlinePanel = props.viewer.editor.uiState.outlinePanel === value ? null : value;
  }

  function toggleAnnotationPanel() {
    props.viewer.editor.uiState.annotationPanel = !props.viewer.editor.uiState.annotationPanel;
  }

  return (
    <div class="flex justify-between py-2 border-b px-2 relative">
      <div class="space-x-4 flex text-sm">
        <button onClick={action(() => toggleOutlinePanel('text'))} class="flex items-center">
          <ListIcon class="mr-1" />
          大纲
        </button>
        <button onClick={action(() => toggleOutlinePanel('image'))} class="flex items-center">
          <BlocksIcon class="mr-1" />
          缩略图
        </button>
        <Scale viewer={props.viewer} />
        <BackAndForward />
      </div>
      <div class="space-x-6 flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ">
        <PageSwitcher viewer={props.viewer} />
      </div>
      <button onClick={action(toggleAnnotationPanel)} class="flex items-center text-sm">
        <PenLineIcon class="mr-1" />
        标注
      </button>
    </div>
  );
}
