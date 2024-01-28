import { useContext } from 'react';
import { AiOutlineOrderedList, AiOutlineHighlight } from 'react-icons/ai';

import { Panels } from '@domain/app/model/material/editor/PdfEditor';
import Button from '@web/components/Button';
import context from '../Context';
import PageSwitcher from './PageSwitcher';
import ScaleChanger from './ScaleChanger';

// eslint-disable-next-line mobx/missing-observer
export default (function Toolbar() {
  const { editor } = useContext(context);

  return (
    <div className="relative flex items-center justify-between p-2">
      <div className="flex">
        <Button onClick={() => editor.togglePanel(Panels.Outline)} className="mr-4">
          <AiOutlineOrderedList />
        </Button>
        <ScaleChanger />
      </div>
      <PageSwitcher />
      <Button onClick={() => editor.togglePanel(Panels.AnnotationList)}>
        <AiOutlineHighlight />
      </Button>
    </div>
  );
});
