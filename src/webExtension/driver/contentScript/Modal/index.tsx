import type { TaskResult } from 'model/task';
import type ClipService from 'service/ClipService';

import IFramePreview from './IFramePreview';

const modalWidth = 680;

export default (function Modal({ taskResult, clipService }: { taskResult: TaskResult; clipService: ClipService }) {
  const { clientWidth: iframeViewportWidth } = document.documentElement;

  return (
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: modalWidth }}>
      {taskResult.contentType === 'html' && (
        <IFramePreview html={taskResult.content} viewportWidth={iframeViewportWidth} width={modalWidth} />
      )}
      <div style={{ textAlign: 'right' }}>
        <button onClick={() => clipService.submit(taskResult, true)}>确认</button>
        <button onClick={() => clipService.cancelByUser()}>取消</button>
      </div>
    </div>
  );
});
