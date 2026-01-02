import { multimediaBlockNodeSchema, multimediaBlockNodeView, remarkImageBlockPlugin } from './blockNodeSchema';
import { multimediaNodeSchema, multimediaNodeView } from './inlineNodeSchema';

export default [
  multimediaBlockNodeSchema,
  multimediaBlockNodeView,
  remarkImageBlockPlugin,
  multimediaNodeSchema,
  multimediaNodeView,
].flat();
