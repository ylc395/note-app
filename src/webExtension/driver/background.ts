import browser from 'webextension-polyfill';

import SessionTaskManager from 'domain/service/SessionTaskManger';
import {
  type AddTaskRequest,
  type FinishTaskRequest,
  type CancelTaskRequest,
  type QueryTaskRequest,
  RequestTypes,
} from 'domain/model/Request';

const taskManager = new SessionTaskManager();

browser.runtime.onMessage.addListener(
  (request: QueryTaskRequest | AddTaskRequest | FinishTaskRequest | CancelTaskRequest, sender) => {
    switch (request.type) {
      case RequestTypes.QuerySessionTasks:
        return Promise.resolve(taskManager.get());
      case RequestTypes.AddTask:
        return taskManager.add(request.task.tabId, request.task.type);
      case RequestTypes.FinishTask:
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return taskManager.finish(sender.tab!.id!);
      case RequestTypes.CancelTask:
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return taskManager.cancel(sender.tab!.id!);
      default:
        break;
    }
  },
);
