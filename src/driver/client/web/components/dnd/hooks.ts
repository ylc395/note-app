import { useDragLayer } from 'react-dnd';

export function useDragItem() {
  return useDragLayer((monitor) => ({ item: monitor.getItem(), position: monitor.getClientOffset() }));
}
