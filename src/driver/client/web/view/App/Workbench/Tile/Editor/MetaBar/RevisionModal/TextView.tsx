import { For, Match, Show, Switch } from 'solid-js';

import type RevisionList from '#domain/client/app/model/RevisionList';
import MarkdownEditor from '#web/view/components/MarkdownEditor';

export default function TextView(props: { revisionList: RevisionList }) {
  return (
    <Show
      when={props.revisionList.changes}
      fallback={
        <Show when={props.revisionList.currentVersion} keyed>
          {(version) => (
            <MarkdownEditor className="grow h-full overflow-auto" readonly defaultValue={version.body.text} />
          )}
        </Show>
      }
    >
      {(changes) => (
        <div class="flex flex-col grow h-full overflow-auto whitespace-pre-wrap font-mono text-sm">
          <h2>
            {changes().newRevision.name || changes().newRevision.createdAt}相较
            {changes().oldRevision.name || changes().oldRevision.createdAt}
          </h2>
          <div class="overflow-auto">
            <For each={changes().diffs}>
              {(change) => (
                <Switch fallback={<span>{change.value}</span>}>
                  <Match when={change.added}>
                    <ins class="bg-bg-success">{change.value}</ins>
                  </Match>
                  <Match when={change.removed}>
                    <del class="bg-bg-danger text-fg-danger">{change.value}</del>
                  </Match>
                </Switch>
              )}
            </For>
          </div>
        </div>
      )}
    </Show>
  );
}
