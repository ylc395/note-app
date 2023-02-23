import { observer } from 'mobx-react-lite';
import { ForwardedRef, forwardRef } from 'react';

import type NoteEditor from 'model/note/Editor';

import Milkdown from './Milkdown';
import Title from './Title';
import Breadcrumb from './Breadcrumb';

export default observer(
  // eslint-disable-next-line mobx/missing-observer
  forwardRef(function NoteEditor({ editor }: { editor: NoteEditor }, ref: ForwardedRef<HTMLDivElement>) {
    return (
      <div className="flex-grow flex-shrink min-h-0 flex flex-col" ref={ref}>
        <Title editor={editor} />
        <Breadcrumb editor={editor} />
        <Milkdown editor={editor} />
      </div>
    );
  }),
);
