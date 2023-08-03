import { useState, useCallback, useRef } from 'react';
import { useFloating } from '@floating-ui/react';
import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import ClipService from 'service/ClipService';
import RectAreaSelector, { type Rect, type ReactAreaSelectorRef } from 'components/RectAreaSelector';
import { TaskTypes } from 'model/task';

export default observer(function ScreenCapture() {
  const [rect, setRect] = useState<null | Rect>(null);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const selectorRef = useRef<ReactAreaSelectorRef | null>(null);
  const { refs, floatingStyles } = useFloating();
  const clipService = container.resolve(ClipService);

  const isEnabled = !clipService.activeTaskResult && clipService.activeTask?.type === TaskTypes.ScreenShot;
  const setRefs = useCallback(
    (ref: ReactAreaSelectorRef | null) => {
      refs.setReference(ref);
      selectorRef.current = ref;
    },
    [refs],
  );

  const _onConfirm = useCallback(async () => {
    if (!rect) {
      throw new Error('no pos');
    }

    await clipService.captureScreen(rect);
    setRect(null);
    selectorRef.current?.stop();
  }, [clipService, rect]);

  return isEnabled ? (
    <div ref={setTarget} className="fixed inset-0">
      {target && (
        <RectAreaSelector className="bg-yellow-50 opacity-40" onSelect={setRect} target={target} ref={setRefs} />
      )}
      {rect && (
        <button onClick={_onConfirm} ref={refs.setFloating} style={floatingStyles}>
          Capture
        </button>
      )}
    </div>
  ) : null;
});
