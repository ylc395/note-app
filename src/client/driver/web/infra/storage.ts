export default {
  set<T>(path: string, value: T) {
    localStorage.setItem(path, JSON.stringify(value));
  },

  get<T>(path: string): NonNullable<T> | null {
    return JSON.parse(localStorage.getItem(path) || 'null');
  },
};
