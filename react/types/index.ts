import type { AsyncFunction } from "../../types";

export type WebBridge = Record<string, AsyncFunction>;

export type LinkBridge<T, U> = {
  isWebViewBridgeAvailable: boolean;
  isNativeMethodAvailable(method: keyof T): boolean;
  isNativeMethodAvailable(method: string): boolean;
  store: U;
  addEventListener<EventName>(
    eventName: EventName,
    listener: (args: any) => void
  ): () => void;
  loose: {
    [K in keyof T]: (...args: any[]) => Promise<any>;
  } & {
    [key: string]: (...args: any[]) => Promise<any>;
  };
} & T;
