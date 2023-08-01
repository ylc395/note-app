import { useContext } from 'react';
import { observer } from 'mobx-react-lite';

import IFramePreview from './IFramePreview';
import ctx from '../Context';

const modalWidth = 680;

export default observer(function Modal() {
  const { clientWidth: iframeViewportWidth } = document.documentElement;
  const { clipService } = useContext(ctx);

  return clipService.activeTaskResult ? (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: modalWidth }}>
      {clipService.activeTaskResult.contentType === 'html' && (
        <IFramePreview
          html={clipService.activeTaskResult.content}
          viewportWidth={iframeViewportWidth}
          width={modalWidth}
        />
      )}
      <div className="text-right">
        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
        <button onClick={() => clipService.submit(clipService.activeTaskResult!)}>确认</button>
        <button onClick={() => clipService.cancelByUser()}>取消</button>
      </div>
    </div>
  ) : null;
});
