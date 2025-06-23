import { ListIcon, PenLineIcon, TextSearchIcon } from 'lucide-solid';

import type PdfViewer from '../PDFViewer';
import PageSwitcher from './PageSwitcher';
import Scale from './Scale';
import BackAndForward from './BackAndForward';

export default function Toolbar(props: { viewer: PdfViewer }) {
  function toggleAnnotationPanel() {
    props.viewer.editor.annotation.state.set('panelVisible', !props.viewer.editor.annotation.state.get('panelVisible'));
  }

  function toggleOutlinePanel() {
    props.viewer.editor.outline.state.set('panelVisible', !props.viewer.editor.outline.state.get('panelVisible'));
  }

  return (
    <div class="flex justify-between py-2 border-b px-2 relative">
      <div class="space-x-4 flex text-sm">
        <button class="flex items-center" onClick={toggleOutlinePanel}>
          <ListIcon class="mr-1" />
          大纲
        </button>
        <Scale viewer={props.viewer} />
        <BackAndForward viewer={props.viewer} />
      </div>
      <div class="space-x-6 flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ">
        <PageSwitcher viewer={props.viewer} />
        <button onClick={() => props.viewer.searcher.textFinder.toggle()}>
          <TextSearchIcon />
        </button>
      </div>
      <button onClick={toggleAnnotationPanel} class="flex items-center text-sm">
        <PenLineIcon class="mr-1" />
        标注
      </button>
    </div>
  );
}
