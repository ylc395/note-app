import { createQuery } from 'mobx-tanstack-query/preset';

import PDFViewer from '#web/components/PDFViewer';
import container from '#utils/singletonContainer';
import PDFDocumentFactory from '#domain/client/app/model/base/PDFDocumentFactory';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export default function PDFPreviewer(props: { title: string; id: string }) {
  const remote = container.resolve(remoteToken);
  const factory = container.resolve(PDFDocumentFactory);

  const file = createQuery(
    ({ signal, queryKey: [_, id] }) => {
      return remote.note.getBlob.query(id, { signal });
    },
    {
      queryKey: ['note.blob', props.id] as const,
    },
  );

  const [doc, setDoc] = createSignal<PDFDocumentProxy>();

  createEffect(() => {
    if (!file.data) {
      return;
    }

    factory.create({ key: props.id, blob: file.data as ArrayBuffer }).then(setDoc);

    onCleanup(() => {
      factory.revoke(props.id);
    });
  });

  return (
    <>
      <Show when={doc()}>{(doc) => <PDFViewer doc={doc()} />}</Show>
    </>
  );
}
