import { observer } from 'mobx-react-lite';
import { Button } from 'antd';
import { action } from 'mobx';
import { useContext } from 'react';
import { OrderedListOutlined, HighlightOutlined } from '@ant-design/icons';

import context, { Panels } from '../Context';
import PageSwitcher from './PageSwitcher';
import ScaleChanger from './ScaleChanger';

export default observer(function Toolbar() {
  const { panelsVisibility } = useContext(context);

  return (
    <div className="relative flex items-center justify-between p-2">
      <div className="flex">
        <Button
          onClick={action(() => (panelsVisibility[Panels.Outline] = !panelsVisibility[Panels.Outline]))}
          className="mr-4"
          type="text"
          size="small"
          icon={<OrderedListOutlined />}
        />
        <ScaleChanger />
      </div>
      <PageSwitcher />
      <Button
        onClick={action(() => (panelsVisibility[Panels.AnnotationList] = !panelsVisibility[Panels.AnnotationList]))}
        type="text"
        size="small"
        icon={<HighlightOutlined />}
      />
    </div>
  );
});
