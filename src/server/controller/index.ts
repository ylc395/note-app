import { router } from './trpc.js';

import noteRouter from './NotesController.js';
import materialRouter from './MaterialsController.js';
import fileRouter from './FilesController.js';
import annotationRouter from './AnnotationController.js';
import memoRouter from './MemosController.js';
import starRouter from './StarController.js';
import versionRouter from './VersionsController.js';

export const routers = router({
  note: noteRouter,
  material: materialRouter,
  file: fileRouter,
  memo: memoRouter,
  annotation: annotationRouter,
  star: starRouter,
  version: versionRouter,
});

export type Routes = typeof routers;
