import { observer } from 'mobx-react-lite';
import AddMenu from './AddMenu';

export default observer(function MaterialSidebar() {
  return (
    <div className="w-60 border-r bg-gray-100">
      <div className="flex items-center justify-between">
        <div>资料库</div>
        <AddMenu />
      </div>
    </div>
  );
});
