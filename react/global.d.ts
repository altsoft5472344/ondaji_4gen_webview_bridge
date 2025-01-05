import type { DefaultEmitter } from "../utils";

import type { Primitive } from "../types";

export {};

declare global {
  interface Window {
    __bridgeMethods__?: string[];
    __bridgeInitialState__?: Record<string, Primitive>;
    nativeEmitter?: DefaultEmitter;
    nativeEmitterMap?: Record<string, DefaultEmitter>;
    nativeBatchedEvents?: [string, ...any][];
    webEmitter?: DefaultEmitter;
    ReactNativeWebView: {
      postMessage: (data: string) => void;
    };
  }
}
