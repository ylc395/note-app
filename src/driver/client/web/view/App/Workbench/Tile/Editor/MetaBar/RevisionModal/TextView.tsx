import { micromark } from 'micromark';

import type RevisionList from '#domain/client/app/model/RevisionList';

export default function TextView(props: { version: NonNullable<RevisionList['currentVersion']> }) {
  return <div class="flex-1 overflow-auto pl-4 border-l border-border-secondary prose prose-sm" innerHTML={micromark(props.version.body.text)} />;
}
