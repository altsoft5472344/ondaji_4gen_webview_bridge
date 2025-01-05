import { bridge } from '../react-native/bridge';
import { Bridge } from '../types';

export interface AppBridgeState extends Bridge {
  token: string;
  setToken(token: string): Promise<void>;
}

export const appBridge = bridge<AppBridgeState>(({ get, set }) => ({
  token: '',
  async setToken(token: string) {
    set({ token });
  },
}));

export type AppBridge = typeof appBridge;
