import { ListIcon, NotepadTextIcon, PenLineIcon, TextSearchIcon } from 'lucide-solid';
import { Switch } from '@ark-ui/solid';
import assert from 'assert';
import { action } from 'mobx';

import PageSwitcher from './PageSwitcher';
import Scale from './Scale';
import BackAndForward from './BackAndForward';
import { useContext } from '../context';

export default function Toolbar() {
  const {
    viewer: { editor },
  } = useContext()!;

  function toggleAnnotationPanel() {
    editor.annotation.uiState.isEnabled = !editor.annotation.uiState.isEnabled;
  }

  function toggleBodyPanel() {
    editor.body.uiState.isEnabled = !editor.body.uiState.isEnabled;
  }

  function toggleOutlinePanel() {
    assert(editor.outline.uiState);
    editor.outline.uiState.isEnabled = !editor.outline.uiState.isEnabled;
  }

  return (
    <div class="flex justify-between py-2 border-b px-2 relative">
      <div class="space-x-4 flex text-sm">
        <button class="flex items-center" onClick={action(toggleBodyPanel)}>
          <NotepadTextIcon class="mr-1" />
          笔记
        </button>
        <button class="flex items-center" onClick={action(toggleOutlinePanel)}>
          <ListIcon class="mr-1" />
          大纲
        </button>
        <Scale />
        <BackAndForward />
      </div>
      <div class="space-x-6 flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ">
        <PageSwitcher />
        <button onClick={() => editor.textFinder.toggle()}>
          <TextSearchIcon />
        </button>
      </div>
      <div class="flex space-x-2">
        <Switch.Root
          checked={editor.svgEditor.isEnabled}
          class="flex"
          onCheckedChange={() => editor.svgEditor.toggle()}
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
