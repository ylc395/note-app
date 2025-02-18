import NoteService from '#domain/client/app/service/NoteService';
import { container } from '#domain/shared/infra/singletons';
import BaseTreeView from './Tree';

export default function MaterialTree() {
  const { materialTreeView: materialExplorer } = container.resolve(NoteService);

  return <BaseTreeView tree={materialExplorer.tree} />;
}
