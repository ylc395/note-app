import { For } from 'solid-js';
import Tile from '#domain/client/app/model/Workbench/Tile';
import { normalizeTitle } from '#domain/shared/model/note';

export default function Tabs(props: { tile: Tile }) {
  return (
    <div>
      <For each={props.tile.editors}>
        {(editor) => <div>{editor.value.result.data ? normalizeTitle(editor.value.result.data!) : ''}</div>}
      </For>
    </div>
  );
}
