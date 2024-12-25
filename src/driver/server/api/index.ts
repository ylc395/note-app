import { router } from './trpc.js';

import noteRouter from './note.js';
import materialRouter from './material.js';
import fileRouter from './file.js';
import annotationRouter from './annotation.js';
import memoRouter from './memo.js';
import starRouter from './star.js';
import contentRouter from './content.js';
import searchRouter from './search.js';
import recyclableRouter from './recyclable.js';

export const routers = router({
  note: noteRouter,
  material: materialRouter,
  file: fileRouter,
  memo: memoRouter,
  annotation: annotationRouter,
  star: starRouter,
  content: contentRouter,
  search: searchRouter,
  recyclable: recyclableRouter,
});

export type Routes = typeof routers;
