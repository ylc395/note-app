import NoteService from '#domain/client/app/service/NoteService';
import { container } from '#domain/shared/infra/singletons';
import BaseTreeView from './Tree';

export default function NoteTree() {
  const { noteTreeView } = container.resolve(NoteService);

  return <BaseTreeView tree={noteTreeView.tree} />;
}
