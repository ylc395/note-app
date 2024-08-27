import { router } from './trpc.js';

import noteRouter from './NotesController.js';
import materialRouter from './MaterialsController.js';
import fileRouter from './FilesController.js';
import annotationRouter from './AnnotationController.js';
import memoRouter from './MemosController.js';
import starRouter from './StarController.js';
import contentRouter from './ContentController.js';
import searchRouter from './SearchController.js';
import recyclableRouter from './RecyclablesController.js';

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
