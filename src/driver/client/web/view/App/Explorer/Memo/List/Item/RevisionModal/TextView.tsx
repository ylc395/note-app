import { micromark } from 'micromark';

import type RevisionList from '#domain/client/app/model/RevisionList';

export default function TextView(props: { version: NonNullable<RevisionList['currentVersion']> }) {
  return (
    <div
      class="flex-1 overflow-y-auto p-4 text-sm text-fg-primary leading-relaxed"
      innerHTML={micromark(props.version.body.text)}
    />
  );
}
