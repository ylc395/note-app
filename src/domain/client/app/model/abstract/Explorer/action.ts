export interface Action {
  key: string;
  name: string;
  action: () => void;
  isAvailable: boolean;
}
