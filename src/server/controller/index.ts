import { router } from './trpc.js';

import noteRouter from './NotesController.js';
import materialRouter from './MaterialsController.js';
import fileRouter from './FilesController.js';

export const routers = router({
  note: noteRouter,
  material: materialRouter,
  file: fileRouter,
});

export type Routes = typeof routers;
