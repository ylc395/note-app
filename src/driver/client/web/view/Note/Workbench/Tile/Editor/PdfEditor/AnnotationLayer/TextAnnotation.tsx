import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import { MessageSquareIcon } from 'lucide-solid';
import { Popover } from '@ark-ui/solid';
import { action, runInAction } from 'mobx';
import Mark from 'mark.js';
import { autoUpdate, computePosition, offset } from '@floating-ui/dom';
import { last } from 'lodash-es';
import assert from 'assert';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import AnnotationManager from '#domain/client/app/model/note/editor/PdfEditor/AnnotationManager';
import PdfViewer from '../PDFViewer';
import { getPage } from '#domain/client/app/model/annotation';

export default function TextAnnotation(props: { annotation: AnnotationVO; page: number; pdfViewer: PdfViewer }) {
  const [buttonRef, setButtonRef] = createSignal<HTMLElement>();
  const [marksRef, setMarksRef] = createSignal<Element[]>();
  const [forceRenderFlag, setForceRenderFlag] = createSignal<number>(0);
  const forceRender = () => setForceRenderFlag(forceRenderFlag() + 1);

  const shouldShowComment = createMemo(() => {
    if (!props.annotation.body) {
      return false;
    }

    return getPage(props.annotation) === props.page;
  });

  function handleOpenChange(value: boolean) {
    props.pdfViewer.editor.annotation.openStatusMap[props.annotation.id] = value;
  }

  function autoRerender() {
    const pageElement = props.pdfViewer.getPageTextLayerElement(props.page);
    const domObserver = new MutationObserver((e) => {
      // 文本搜索高亮等功能可能会破坏我们渲染出的 mark 元素。我们需要在 mark 元素被破坏时重新渲染
      if (marksRef()?.some((el) => !el.isConnected)) {
        forceRender();
        return;
      }

      // 该组件被渲染时，textLayer 很可能还没就绪，而是在之后的某个时刻就绪（以 endOfContent 元素的出现为标志）。在那时我们触发一次重新渲染
      if (
        e.some(({ addedNodes }) =>
          Array.from(addedNodes).find((node) => node instanceof HTMLElement && node.classList.contains('endOfContent')),
        )
      ) {
        forceRender();
        return;
      }
    });

    domObserver.observe(pageElement, { subtree: true, childList: true });
    onCleanup(() => domObserver.disconnect());
  }

  function autoUpdateButton() {
    const markEl = last(marksRef());
    const buttonEl = buttonRef();

    if (markEl && buttonEl) {
      const stopAutoUpdate = autoUpdate(markEl, buttonEl, () => {
        computePosition(markEl, buttonEl, {
          placement: 'right-start',
          middleware: [offset(5)],
        }).then(({ x, y }) => {
          Object.assign(buttonEl.style, { left: `${x}px`, top: `${y}px` });
        });
      });

      onCleanup(stopAutoUpdate);
    }
  }

  function render() {
    forceRenderFlag();
    const selector = props.annotation.selector;
    const pageEl = props.pdfViewer.getPageTextLayerElement(props.page, true); // render 的时候可能整页的 DOM 都没了但视图层还没来得及销毁对应的 PageAnnotationLayer 组件，此时可能取不到 page 元素

    assert(selector.type === 'PDFTextPositionSelector');

    // 目前没有办法确保 render 调用时，textLayer 一定已经渲染好了。只能通过检查是否有 .endOfContent 元素来检查 textLayer 是否就绪
    if (!pageEl?.querySelector('.endOfContent')) {
      return;
    }

    const range = AnnotationManager.positionToRange(selector.position, props.page);
    const marker = new Mark(pageEl);
    const markEls: HTMLElement[] = [];
    const className = `mark-${props.annotation.id}`;

    marker.markRanges([range], {
      className,
      each: (markEl) => {
        (markEl as HTMLElement).style.backgroundColor = selector.color;
        markEls.push(markEl as HTMLElement);
      },
      done: () => {
        setMarksRef(markEls);
        runInAction(() => {
          if (markEls[0]) {
            props.pdfViewer.annotationElementMap.set(props.annotation.id, markEls[0]);
          }
        });
      },
    });

    onCleanup(() => {
      marker.unmark({ className });
    });
  }

  createEffect(render);
  createEffect(autoUpdateButton);
  createEffect(autoRerender);

  onCleanup(
    action(() => {
      props.pdfViewer.annotationElementMap.delete(props.annotation.id);
    }),
  );

  return (
    <Show when={shouldShowComment()}>
      <Popover.Root
        onOpenChange={action(({ open }) => handleOpenChange(open))}
        defaultOpen={props.pdfViewer.editor.annotation.openStatusMap[props.annotation.id]}
        positioning={{ placement: 'right-start' }}
        unmountOnExit
        lazyMount
      >
        <Popover.Trigger ref={setButtonRef} class="absolute cursor-pointer flex">
          <MessageSquareIcon />
        </Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content class="w-64 bg-gray-200 ml-1 p-2">{props.annotation.body}</Popover.Content>
        </Popover.Positioner>
      </Popover.Root>
    </Show>
  );
}
