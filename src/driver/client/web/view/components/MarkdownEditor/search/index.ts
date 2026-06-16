import { $prose } from '@milkdown/kit/utils';
import { search } from 'prosemirror-search';

export { Searcher, type Options } from './Searcher';

export default $prose(() => {
  return search();
});
