import type { NotePatchDTO } from '#domain/shared/model/note';

export interface Command<T = unknown> {
  type: symbol;
  payload: T;
}

function create<P, T = Command<P>>() {
  const commandType: symbol = Symbol();

  return {
    create: (payload: P) => ({
      type: commandType,
      payload,
    }),

    is: (v: unknown): v is T => Boolean(v && typeof v === 'object' && 'type' in v && v.type === commandType),
  };
}

export const goToPageCommand = create<number>();

export const goToAnnotationCommand = create<string>();

export const updateCommand = create<NotePatchDTO>();
