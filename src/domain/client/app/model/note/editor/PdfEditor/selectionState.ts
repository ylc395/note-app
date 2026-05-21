import type { Position } from './AnnotationManager';

export interface SelectionState {
  readonly text: string;
  readonly position: Readonly<Required<Position>>;
  floating?: Readonly<{
    isActive: boolean;
    dispose: () => void;
  }>;
}
