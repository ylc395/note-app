import { makeAutoObservable } from 'mobx';

export function togglable() {
  return makeAutoObservable(
    {
      isEnabled: false,

      toggle() {
        this.isEnabled = !this.isEnabled;
      },
    },
    undefined,
    { autoBind: true },
  );
}
