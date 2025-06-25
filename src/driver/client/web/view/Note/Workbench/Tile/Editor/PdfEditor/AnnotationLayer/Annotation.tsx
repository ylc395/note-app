import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import { MessageSquareIcon } from 'lucide-solid';
import { Popover } from '@ark-ui/solid';
import { action } from 'mobx';
import Mark from 'mark.js';
import { autoUpdate, computePosition, hide, offset } from '@floating-ui/dom';
import assert from 'assert';
import { last } from 'lodash-es';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import type PdfViewer from '../PDFViewer';

export default function Annotation(props: { annotation: AnnotationVO; page: number; pdfViewer: PdfViewer }) {
  let buttonRef: HTMLButtonElement | undefined;
  const [marksRef, setMarksRef] = createSignal<Element[]>();
  const [domUpdatedFlag, setDomUpdatedFlag] = createSignal<number>(0);
  const forceRender = () => setDomUpdatedFlag(domUpdatedFlag() + 1);

  const shouldShowComment = createMemo(() => {
    if (!props.annotation.body) {
      return false;
    }

    if (props.annotation.selector.type === 'PDFTextPositionSelector') {
      return props.annotation.selector.position.startPage === props.page;
    }

    return false;
  });

  function handleOpenChange(value: boolean) {
    props.pdfViewer.annotationOpenStatus[props.annotation.id] = value;
  }

  // 文本搜索高亮等功能可能会破坏我们渲染出的 mark 元素。我们需要在 mark 元素被破坏时重新渲染
  function autoRerender() {
    const pageElement = props.pdfViewer.getPageTextLayerElement(props.page);

    const domObserver = new MutationObserver(() => {
      if (marksRef()?.some((el) => !el.isConnected)) {
        forceRender();
      }
    });
    domObserver.observe(pageElement, { subtree: true, childList: true });

    return domObserver;
  }

  function autoUpdateButton() {
    const markEl = last(marksRef());

    if (markEl && buttonRef) {
      const stopAutoUpdate = autoUpdate(markEl, buttonRef, () => {
        computePosition(markEl, buttonRef, {
          placement: 'right-start',
          middleware: [offset(5), hide({ padding: 10 })],
        }).then(({ x, y, middlewareData }) => {
          Object.assign(buttonRef.style, { left: `${x}px`, top: `${y}px` });

          if (middlewareData.hide) {
            buttonRef.style.visibility = middlewareData.hide.referenceHidden ? 'hidden' : 'visible';
          }
        });
      });

      onCleanup(stopAutoUpdate);
    }
  }

  function render() {
    domUpdatedFlag();
    const selector = props.annotation.selector;

    if (selector.type !== 'PDFTextPositionSelector') {
      return;
    }

    let range: Mark.Range | undefined;

    if (selector.position.startPage === selector.position.endPage) {
      range = {
        start: selector.position.startOffset,
        length: selector.position.endOffset - selector.position.startOffset,
      };
    } else if (selector.position.startPage === props.page) {
      range = {
        start: selector.position.startOffset,
        length: Infinity,
      };
    } else if (selector.position.endPage === props.page) {
      range = {
        start: 0,
        length: selector.position.endOffset,
      };
    } else {
      range = { start: 0, length: Infinity };
    }

    assert(range);
    const marker = new Mark(props.pdfViewer.getPageTextLayerElement(props.page));
    const markEls: HTMLElement[] = [];
    const className = `mark-${props.annotation.id}`;
    let observer: MutationObserver | undefined;

    marker.markRanges([range], {
      className,
      each: (markEl) => {
        (markEl as HTMLElement).style.backgroundColor = props.annotation.color;
        markEls.push(markEl as HTMLElement);
      },
      done: () => {
        setMarksRef(markEls);
        observer = autoRerender();
      },
    });

    onCleanup(() => {
      marker.unmark({ className });
      setMarksRef(undefined);
      observer?.disconnect();
    });
  }

  createEffect(render);
  createEffect(autoUpdateButton);
  createEffect(autoRerender);

  return (
    <Show when={shouldShowComment()}>
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
