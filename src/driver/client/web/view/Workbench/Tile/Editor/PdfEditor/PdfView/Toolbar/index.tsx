import { ListIcon, NotepadTextIcon, PenLineIcon, TextSearchIcon } from 'lucide-solid';
import { Switch } from '@ark-ui/solid';
import assert from 'assert';

import type PdfViewer from '../PDFViewer';
import PageSwitcher from './PageSwitcher';
import Scale from './Scale';
import BackAndForward from './BackAndForward';

export default function Toolbar(props: { viewer: PdfViewer }) {
  function toggleAnnotationPanel() {
    props.viewer.editor.annotation.toggle();
  }

  function toggleBodyPanel() {
    props.viewer.editor.body.toggle();
  }

  function toggleOutlinePanel() {
    assert(props.viewer.editor.outline.uiState);
    props.viewer.editor.outline.uiState.panelVisible = !props.viewer.editor.outline.uiState.panelVisible;
  }

  return (
    <div class="flex justify-between py-2 border-b px-2 relative">
      <div class="space-x-4 flex text-sm">
        <button class="flex items-center" onClick={toggleBodyPanel}>
          <NotepadTextIcon class="mr-1" />
          笔记
        </button>
        <button class="flex items-center" onClick={toggleOutlinePanel}>
          <ListIcon class="mr-1" />
          大纲
        </button>
        <Scale viewer={props.viewer} />
        <BackAndForward viewer={props.viewer} />
      </div>
      <div class="space-x-6 flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ">
        <PageSwitcher viewer={props.viewer} />
        <button onClick={() => props.viewer.textFinder.model.toggle()}>
          <TextSearchIcon />
        </button>
      </div>
      <div class="flex space-x-2">
        <Switch.Root
          checked={props.viewer.editor.annotation.svgEditor.isEnabled}
          class="flex"
          onCheckedChange={() => props.viewer.editor.annotation.svgEditor.toggle()}
        >
          <Switch.Label>浏览</Switch.Label>
          <Switch.Control class="w-12 flex bg-gray-100">
            <Switch.Thumb class="w-6 bg-white" />
          </Switch.Control>
          <Switch.Label>标注</Switch.Label>
          <Switch.HiddenInput />
        </Switch.Root>
        <button onClick={toggleAnnotationPanel} class="flex items-center text-sm">
          <PenLineIcon class="mr-1" />
          查看标注
        </button>
      </div>
    </div>
  );
}
