import { observer } from 'mobx-react-lite';
import { ForwardedRef, forwardRef } from 'react';

import type NoteEditor from 'model/note/Editor';

import Body from './Body';
import Title from './Title';
import Breadcrumb from './Breadcrumb';

export default observer(
  // eslint-disable-next-line mobx/missing-observer
  forwardRef(function NoteEditor({ editor }: { editor: NoteEditor }, ref: ForwardedRef<HTMLDivElement>) {
    return (
      <div className="flex min-h-0 shrink grow flex-col" ref={ref}>
        <Title editor={editor} />
        <Breadcrumb editor={editor} />
        <Body editor={editor} />
      </div>
    );
  }),
);
