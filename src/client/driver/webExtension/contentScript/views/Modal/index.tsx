import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import PageService from '@domain/service/PageService';

import IFramePreview from './IFramePreview';
import Options from './Options';
import usePreventScroll from '../hooks/usePreventScroll';

export default observer(function Modal() {
  const { activeTaskResult, submit, cancelByUser, config } = container.resolve(PageService);

  usePreventScroll(Boolean(activeTaskResult));

  return activeTaskResult ? (
    <div className="fixed left-1/2 top-20 z-[999] -translate-x-1/2  rounded-xl bg-white px-4 shadow-2xl">
      <h2 className="py-4 text-lg font-semibold">StarNote Clipper - 预览效果</h2>
      {activeTaskResult.contentType === 'html' && <IFramePreview html={activeTaskResult.content} />}
      <Options />
      <div className="py-4 text-right">
        <button disabled={!config.isValidTarget} className="button mr-2 px-3 py-1" onClick={submit}>
          确认
        </button>
        <button className="button px-3 py-1" onClick={cancelByUser}>
          取消
        </button>
      </div>
    </div>
  ) : null;
});
