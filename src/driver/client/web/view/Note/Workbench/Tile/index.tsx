import { Splitter } from '@ark-ui/solid';
import { Show } from 'solid-js';
import type Tile from '#domain/client/app/model/Workbench/Tile';

import Tabs from './Tabs';
import TitleInput from './TitleInput';
import Editor from './Editor';

export default function TileView(props: { tile: Tile; panelId?: string }) {
  const content = (
    <>
      <Tabs tile={props.tile} />
      <Show when={props.tile.currentEditor} fallback={<p>empty</p>}>
        {(editor) => (
          <div>
            <TitleInput editor={editor()} />
            <Editor editor={editor()} />
          </div>
        )}
      </Show>
    </>
  );

  if (props.panelId) {
    return <Splitter.Panel id={props.panelId}>{content}</Splitter.Panel>;
  }

  return <div>{content}</div>;
}
