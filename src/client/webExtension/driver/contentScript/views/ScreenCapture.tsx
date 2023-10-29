import { useState, useRef } from 'react';
import { useFloating, offset } from '@floating-ui/react';
import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useMemoizedFn } from 'ahooks';

import PageService from 'service/PageService';
import RectAreaSelector, { type Rect, type ReactAreaSelectorRef } from '../../../../shared/components/RectAreaSelector';
import { TaskTypes } from 'model/task';

import usePreventScroll from './hooks/usePreventScroll';

export default observer(function ScreenCapture() {
  const [rect, setRect] = useState<null | Rect>(null);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const selectorRef = useRef<ReactAreaSelectorRef | null>(null);
  const { refs, floatingStyles } = useFloating({
    middleware: [offset(16)],
  });
  const clipService = container.resolve(PageService);
  const isEnabled = !clipService.activeTaskResult && clipService.activeTask?.type === TaskTypes.ScreenShot;
  const setRefs = useMemoizedFn((ref: ReactAreaSelectorRef | null) => {
    refs.setReference(ref);
    selectorRef.current = ref;
  });

  const _onConfirm = async () => {
    if (!rect) {
      throw new Error('no pos');
    }

    await clipService.captureScreen(rect);
    setRect(null);
    selectorRef.current?.stop();
  };

  if (!isEnabled && rect) {
    setRect(null);
  }

  usePreventScroll(Boolean(target));

  return isEnabled ? (
    <div ref={setTarget} className="fixed inset-0 z-[999]">
      <div className="message pointer-events-none top-16 select-none">按住鼠标左键，拖拽选择一块区域。点击右键取消</div>
      {target && (
        <RectAreaSelector
          targetClassName="cursor-crosshair"
          className="bg-blue-200 opacity-40"
          onSelect={setRect}
          onStop={clipService.cancelByUser}
          target={target}
          ref={setRefs}
        />
      )}
      {rect && (
        <button className="button px-3 py-1 text-sm" onClick={_onConfirm} ref={refs.setFloating} style={floatingStyles}>
          保存
        </button>
      )}
    </div>
  ) : null;
});
