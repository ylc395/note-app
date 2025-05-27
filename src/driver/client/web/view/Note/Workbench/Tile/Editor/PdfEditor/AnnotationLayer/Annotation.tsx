import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { MessageSquareIcon } from 'lucide-solid';
import { Popover } from '@ark-ui/solid';
import { action } from 'mobx';
import { markRange } from '#third-party/text-fragments-polyfill/text-fragment-utils';
import { autoUpdate, computePosition, offset } from '@floating-ui/dom';
import assert from 'assert';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import type PdfViewer from '../PDFViewer';

export default function Annotation(props: { annotation: AnnotationVO; page: number; pdfViewer: PdfViewer }) {
  let buttonRef: HTMLButtonElement | undefined;
  const [markRef, setMarkRef] = createSignal<Element>();

  function handleOpenChange(value: boolean) {
    props.pdfViewer.annotationOpenStatus[props.annotation.id] = value;
  }

  createEffect(() => {
    if (props.annotation.selector.type !== 'PDFTextPositionSelector') {
      return;
    }

    let range: Range | undefined;

    if (props.annotation.selector.position.startPage === props.annotation.selector.position.endPage) {
      range = props.pdfViewer.positionToRange(props.annotation.selector.position);
    } else if (props.annotation.selector.position.startPage === props.page) {
      range = props.pdfViewer.positionToRange({ ...props.annotation.selector.position, endOffset: Infinity });
    } else if (props.annotation.selector.position.endPage === props.page) {
      range = props.pdfViewer.positionToRange({ ...props.annotation.selector.position, startOffset: 0 });
    }

    assert(range);

    const marks = markRange(range);
    const firstMark = marks[0];

    if (!firstMark) {
      return;
    }

    for (const markEl of marks) {
      (markEl as HTMLElement).style.backgroundColor = props.annotation.color;
    }

    setMarkRef(firstMark);
  });

  createEffect(() => {
    const markEl = markRef();

    if (markEl && buttonRef) {
      const stopAutoUpdate = autoUpdate(markEl, buttonRef, () => {
        computePosition(markEl, buttonRef, {
          placement: 'right-start',
          middleware: [offset(5)],
        }).then(({ x, y }) => {
          Object.assign(buttonRef!.style, { left: `${x}px`, top: `${y}px` });
        });
      });

      onCleanup(stopAutoUpdate);
    }
  });

  return (
    <Show
      when={
        props.annotation.body &&
        props.annotation.selector.type === 'PDFTextPositionSelector' &&
        props.annotation.selector.position.startPage === props.page
      }
    >
      <Popover.Root
        onOpenChange={action(({ open }) => handleOpenChange(open))}
        defaultOpen={props.pdfViewer.annotationOpenStatus[props.annotation.id]}
        positioning={{ placement: 'right-start' }}
        unmountOnExit
        lazyMount
      >
        <Popover.Trigger ref={buttonRef} class="absolute cursor-pointer flex">
          <MessageSquareIcon />
        </Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content class="w-64 bg-gray-200 ml-1 p-2">{props.annotation.body}</Popover.Content>
        </Popover.Positioner>
      </Popover.Root>
    </Show>
  );
}
