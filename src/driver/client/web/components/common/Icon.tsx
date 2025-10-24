import { Match, Switch } from 'solid-js';
import { FileTextIcon, LayoutGridIcon, GlobeIcon } from 'lucide-solid';
import data from '@emoji-mart/data';
import { init } from 'emoji-mart';
import { observable } from 'mobx';

import { MimeTypes } from '#domain/shared/model/file';
import { decodeIcon } from '#domain/client/app/model/note/icon';

const dataLoaded = observable.box(false);

init({ data }).then(() => dataLoaded.set(true));

export default function Icon(props: { icon?: string | null; mimeType?: string | null; iconClassName?: string }) {
  return (
    <Switch fallback={<FileTextIcon class={props.iconClassName} />}>
      <Match when={props.icon && dataLoaded.get()}>
        <em-emoji class={props.iconClassName} attr:shortcodes={decodeIcon('emoji', props.icon!)}></em-emoji>
      </Match>
      <Match when={props.mimeType === MimeTypes.HTML}>
        <GlobeIcon class={props.iconClassName} />
      </Match>
      <Match when={props.mimeType === MimeTypes.HTML}>
        <GlobeIcon class={props.iconClassName} />
      </Match>
      <Match when={props.mimeType}>
        <LayoutGridIcon class={props.iconClassName} />
      </Match>
    </Switch>
  );
}
