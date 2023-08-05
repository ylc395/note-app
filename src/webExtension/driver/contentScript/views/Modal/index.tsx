import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import ClipService from 'service/ClipService';

import IFramePreview from './IFramePreview';
import Options from './Options';
import usePreventScroll from '../hooks/usePreventScroll';

const modalWidth = 680;

export default observer(function Modal() {
  const { clientWidth: iframeViewportWidth } = document.documentElement;
  const clipService = container.resolve(ClipService);

  usePreventScroll(Boolean(clipService.activeTaskResult));

  return clipService.activeTaskResult ? (
    <div
      className="fixed left-1/2 top-20 z-[999] box-content -translate-x-1/2  rounded-xl bg-white px-4 shadow-2xl"
      style={{ width: modalWidth }}
    >
      <h2 className="py-4 text-lg font-semibold">StarNote Clipper - 预览效果</h2>
      {clipService.activeTaskResult.contentType === 'html' && (
        <IFramePreview
          html={clipService.activeTaskResult.content}
          viewportWidth={iframeViewportWidth}
          width={modalWidth}
        />
      )}
      <Options />
      <div className="py-4 text-right">
        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
        <button className="button mr-2" onClick={() => clipService.submit(clipService.activeTaskResult!)}>
          确认
        </button>
        <button className="button" onClick={clipService.cancelByUser}>
          取消
        </button>
      </div>
    </div>
  ) : null;
});
