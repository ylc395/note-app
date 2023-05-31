import { observer } from 'mobx-react-lite';
import { useBoolean } from 'ahooks';

import List from './List';
import Search from './Search';
import Operations from './Operations';
import NewMemo from './NewMemo';

export default observer(() => {
  const [isExpanded, { toggle }] = useBoolean(false);

  return (
    <div className="box-border flex h-screen flex-col pt-1">
      <div className="border-0 border-b  border-solid border-gray-200 bg-white p-2">
        <div className="flex items-center justify-between">
          <h1 className="m-0 mr-4 shrink-0 text-base">思考碎片</h1>
          <Search />
        </div>
      </div>
      <Operations toggle={toggle} isExpanded={isExpanded} />
      {isExpanded && <NewMemo />}
      <List />
    </div>
  );
});
