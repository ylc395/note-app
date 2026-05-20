import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { MessageSquareIcon } from 'lucide-solid';
import { Popover } from '@ark-ui/solid';
import { action } from 'mobx';
import Mark from 'mark.js';
import { autoUpdate, computePosition, offset } from '@floating-ui/dom';
import { first, last } from 'lodash-es';
import assert from 'assert';

import shell from '#web/infra/shell';
import type { AnnotationVO } from '#domain/shared/model/annotation';
import { APP_NAME } from '#domain/shared/infra/constants';
import AnnotationManager from '#domain/client/app/model/note/editor/PdfEditor/AnnotationManager';
import { getPageRange } from '#domain/client/app/model/annotation';

import { useContext } from '../../context';
import Button from '#web/view/components/Button';

export default function TextAnnotation(props: { annotation: AnnotationVO; page: number }) {
  const {
    viewer: { viewer, editor },
  } = useContext()!;

  const [buttonRef, setButtonRef] = createSignal<HTMLElement>();
  const [marksRef, setMarksRef] = createSignal<Element[]>();
  const [forceRenderFlag, setForceRenderFlag] = createSignal<number>(0);
  const forceRender = () => setForceRenderFlag(forceRenderFlag() + 1);

  const shouldShowComment = createMemo(() => {
    if (!props.annotation.body) {
      return false;
    }

    return first(getPageRange(props.annotation)) === props.page;
  });

  function handleOpenChange(value: boolean) {
    editor.annotation.openStatusMap[props.annotation.id] = value;
  }

  createEffect(function autoUpdateButton() {
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
  });

  createEffect(function render() {
    forceRenderFlag();
    const selector = props.annotation.selector;
    const pageEl = viewer.getPageInfo(props.page).textLayer;

    // render 的时候可能整页的 DOM 都没了但视图层还没来得及销毁对应的 PageAnnotationLayer 组件，此时可能取不到 page 元素
    if (!pageEl) {
      return;
    }

    assert(selector.type === 'PDFTextPositionSelector');
    const range = AnnotationManager.positionToRange(selector.position, props.page);
    const marker = new Mark(pageEl);
    const markEls: HTMLElement[] = [];
    const className = `${APP_NAME}-pdf-annotation-mark-${props.annotation.id}`;

    marker.markRanges([range], {
      className,
      each: (markEl) => {
        (markEl as HTMLElement).style.backgroundColor = selector.color;
        markEls.push(markEl as HTMLElement);
      },
      done: () => {
        setMarksRef(markEls);
      },
    });

    onCleanup(() => {
      marker.unmark({ className });
    });
  });

  createEffect(function autoRerender() {
    const { textLayer } = viewer.getPageInfo(props.page);

    if (!textLayer) {
      return;
    }

    const domObserver = new MutationObserver(() => {
      // 文本搜索高亮等功能可能会破坏我们渲染出的 mark 元素。我们需要在 mark 元素被破坏时重新渲染
      if (marksRef()?.some((el) => !el.isConnected)) {
        forceRender();
        return;
      }
    });

    domObserver.observe(textLayer, { subtree: true, childList: true });
    onCleanup(() => domObserver.disconnect());
  });

  return (
    <Show when={shouldShowComment()}>
      <Popover.Root
        onOpenChange={action(({ open }) => handleOpenChange(open))}
        defaultOpen={editor.annotation.openStatusMap[props.annotation.id]}
        positioning={{ placement: 'right-start' }}
        unmountOnExit
        lazyMount
      >
        <Popover.Trigger
          ref={setButtonRef}
          asChild={(triggerProps) => (
            <Button
              square
              {...triggerProps()}
              ref={setButtonRef}
              class="absolute cursor-pointer flex pointer-events-auto"
            >
              <MessageSquareIcon />
            </Button>
          )}
        ></Popover.Trigger>
        <Portal mount={shell.appRoot}>
          <Popover.Positioner class="pointer-events-auto">
            <Popover.Content class="w-64 bg-gray-200 ml-1 p-2">{props.annotation.body}</Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </Show>
  );
}
