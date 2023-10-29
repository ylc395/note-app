import 'tailwindcss/tailwind.css';
import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { LoadingOutlined } from '@ant-design/icons';

import TaskService from 'service/TaskService';

import Menu from './Menu';
import History from './History';
import Network from './Network';
import TargetOption from './TargetOption';

export default observer(function App() {
  const taskService = container.resolve(TaskService);
  const { readyState, targetTab } = taskService;
  const isVisible = readyState === 'READY' || readyState === 'DOING';
  const isPageLoading = readyState === 'PAGE_NOT_READY';

  return (
    <div className="w-96 bg-gray-100 px-6">
      <h1 className="py-4 text-lg">StarNote Clipper</h1>
      {isVisible && (
        <>
          <p title={targetTab?.url} className="mb-4 truncate text-sm text-gray-400">
            当前页面：{targetTab?.url}
          </p>
          <TargetOption />
          <Menu />
        </>
      )}
      {isPageLoading && (
        <div className="flex items-center justify-center py-4">
          <LoadingOutlined className="mr-2" />
          等待页面加载...
        </div>
      )}
      <div className="flex justify-between">
        <Network />
        <History />
      </div>
    </div>
  );
});
