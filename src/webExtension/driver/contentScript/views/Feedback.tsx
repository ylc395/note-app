import { container } from 'tsyringe';
import { useEffect } from 'react';
import { useBoolean, useResetState } from 'ahooks';
import { CheckCircleFilled, CloseOutlined } from '@ant-design/icons';

import { EventNames } from 'model/task';
import EventBus from 'infra/EventBus';

// eslint-disable-next-line mobx/missing-observer
export default function Feedback() {
  const eventBus = container.resolve(EventBus);
  const [isShowing, { setTrue: open, setFalse: close }] = useBoolean(false);
  const [countDown, setCountDown, resetCountDown] = useResetState(5);

  useEffect(() => {
    eventBus.on(EventNames.FinishTask, open);

    return () => {
      eventBus.on(EventNames.FinishTask, open);
    };
  }, [eventBus, open]);

  useEffect(() => {
    if (!isShowing) {
      return;
    }

    if (countDown > 0) {
      const timer = setTimeout(() => setCountDown(countDown - 1), 1000);
      return () => {
        clearTimeout(timer);
      };
    }

    close();
    resetCountDown();
  }, [close, countDown, isShowing, resetCountDown, setCountDown]);

  return isShowing ? (
    <div className="message top-20">
      <CheckCircleFilled className="mr-2 text-green-500" />
      保存成功（{countDown}s）
      <button onClick={close} className="ml-4 flex">
        <CloseOutlined />
      </button>
    </div>
  ) : null;
}
