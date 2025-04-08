import { Checkbox } from '@ark-ui/solid';
import { CheckIcon } from 'lucide-solid';
import { Show } from 'solid-js';
import { action } from 'mobx';

import type PdfViewer from '../PDFViewer';

export default function Options(props: { viewer: PdfViewer }) {
  return (
    <div>
      <Show when={props.viewer.editor.uiState}>
        {(uiState) => (
          <Checkbox.Root
            class="flex"
            classList={{ 'opacity-40': !props.viewer.editor.annotation.hasNative }}
            disabled={!props.viewer.editor.annotation.hasNative}
            defaultChecked={uiState()['annotation.native']}
            onCheckedChange={action((e) => (uiState()['annotation.native'] = e.checked as boolean))}
          >
            <Checkbox.Control>
              <Checkbox.Indicator>
                <CheckIcon />
              </Checkbox.Indicator>
            </Checkbox.Control>
            <Checkbox.Label>显示文档自带的标注</Checkbox.Label>
            <Checkbox.HiddenInput />
          </Checkbox.Root>
        )}
      </Show>
    </div>
  );
}
