import {
  BuildOutlined,
  BookOutlined,
  StarOutlined,
  NumberOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';

import { ExplorerTypes } from 'model/Explorer';
import Button from './Button';

// eslint-disable-next-line mobx/missing-observer
export default function ActivityBar() {
  return (
    <nav className="flex h-full w-14 flex-col justify-between border-0 border-r border-solid border-gray-200 bg-gray-50 text-center">
      <div>
        <div>
          <Button explorerType={ExplorerTypes.Materials}>
            <DatabaseOutlined />
          </Button>
          <Button explorerType={ExplorerTypes.Notes}>
            <BookOutlined />
          </Button>
          <Button explorerType={ExplorerTypes.Memo}>
            <BuildOutlined />
          </Button>
        </div>
        <div className="border-0 border-t border-solid border-gray-200">
          <Button>
            <StarOutlined />
          </Button>
          <Button>
            <NumberOutlined />
          </Button>
          <Button>
            <DeleteOutlined />
          </Button>
        </div>
      </div>
      <div className="mb-1">
        <Button>
          <SearchOutlined />
        </Button>
        <Button>
          <SettingOutlined />
        </Button>
      </div>
    </nav>
  );
}
