import { ListIcon, NotepadTextIcon, PenLineIcon, TextSearchIcon, TextSelectIcon } from 'lucide-solid';
import { Switch } from '@ark-ui/solid';
import assert from 'assert';
import { action } from 'mobx';

import Button from '#web/view/components/Button';
import PageSwitcher from './PageSwitcher';
import Scale from './Scale';
import { useContext } from '../context';
import { Show } from 'solid-js';
import { IS_DEV } from '#domain/shared/infra/env';

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
    <div class="flex justify-between py-2 border-b border-border-secondary pl-2 pr-4 relative">
      <div class="flex text-sm space-x-2">
        <Button size="small" selected={editor.body.uiState.isEnabled} onClick={action(toggleBodyPanel)}>
          <NotepadTextIcon class="mr-1" />
          笔记
        </Button>
        <Button size="small" selected={editor.outline.uiState.isEnabled} onClick={action(toggleOutlinePanel)}>
          <ListIcon class="mr-1" />
          大纲
        </Button>
        <Button size="small" selected={editor.textFinder.isEnabled} onClick={() => editor.textFinder.toggle()}>
          <TextSearchIcon class="mr-1" />
          搜索全文
        </Button>
        <Show when={IS_DEV}>
          <Button
            size="small"
            selected={editor.texts.displayText}
            onClick={action(() => (editor.texts.displayText = !editor.texts.displayText))}
          >
            <TextSelectIcon class="mr-1" />
            渲染文本(DEV)
          </Button>
        </Show>
      </div>
      <div class="space-x-6 flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ">
        <PageSwitcher />
        <Scale />
      </div>
      <div class="flex space-x-2">
        <Switch.Root
          checked={editor.svgEditor.isEnabled}
          class="flex"
          onCheckedChange={() => editor.svgEditor.toggle()}
        >
          <Switch.Label>浏览</Switch.Label>
          <Switch.Control class="w-12 flex bg-bg-tertiary">
            <Switch.Thumb class="w-6 bg-bg-primary" />
          </Switch.Control>
          <Switch.Label>标注</Switch.Label>
          <Switch.HiddenInput />
        </Switch.Root>
        <Button
          size="small"
          selected={editor.annotation.uiState.isEnabled}
          onClick={action(toggleAnnotationPanel)}
          class="flex items-center text-sm"
        >
          <PenLineIcon class="mr-1" />
          查看标注
        </Button>
      </div>
    </div>
  );
}
