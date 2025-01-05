import { bridge } from '../react-native/bridge';
import { Bridge } from '../types';

export interface AppBridgeState extends Bridge {
  token: string;
  setToken(token: string): Promise<void>;
  count: number;
  increase: () => Promise<void>;
}

export const appBridge = bridge<AppBridgeState>(({ get, set }) => ({
  count: 0,
  async increase() {
    set({ count: get().count + 1 });
  },
  token: '',
  async setToken(token: string) {
    set({ token });
  },
}));

export type AppBridge = typeof appBridge;
