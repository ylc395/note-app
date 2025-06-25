import { Show } from 'solid-js';
import { Splitter } from '@ark-ui/solid';
import Workbench from '#domain/client/app/model/Workbench';
import container from '#utils/singletonContainer';

import TileNode from './TileNode';

export default function WorkbenchView(props: { panelId: string }) {
  const workbench = container.resolve(Workbench);

  return (
    <Splitter.Panel
      id={props.panelId}
      class="flex flex-col !overflow-clip" // overflow-clip 的理由：https://stackoverflow.com/questions/11039885/scrollintoview-causing-the-whole-page-to-move
    >
      <Show when={workbench.root} fallback={<div class="grow">empty</div>}>
        {(tile) => <TileNode tile={tile()} />}
      </Show>
    </Splitter.Panel>
  );
}
