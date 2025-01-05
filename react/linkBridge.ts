import type { Bridge, BridgeStore, ExtractStore } from "../types";
import { createEvents } from "../utils";

import { BridgeInstance } from "./internal/bridgeInstance";
import { mockStore } from "./internal/mockStore";

export interface LinkBridgeOptions<
  T extends BridgeStore<T extends Bridge ? T : any>
> {
  initialBridge?: Partial<ExtractStore<T>>;
  onReady?: (method: BridgeInstance<T>) => void;
}


export const linkBridge = <T extends BridgeStore<T extends Bridge ? T : any>>(
  options: LinkBridgeOptions<T> = {}
): BridgeInstance<T> => {
  console.log("===== linkBridge =====");

  /** 서버 사이드 렌더링(SSR) 환경에서의 처리 */
  if (typeof window === "undefined") {
    return {
      addEventListener: (_eventName, _listener) => () => {},
      store: mockStore(options?.initialBridge) as unknown as Omit<
        T,
        "setState"
      >,
    } as BridgeInstance<T>;
  }

  // 이벤트 에미터 인스턴스 생성 (이벤트 발행/구독 시스템)
  const emitter = createEvents();

  if (!window.nativeEmitter) {
    window.nativeEmitter = emitter;
  }

  const bridgeMethods = window.__bridgeMethods__ ?? [];
  const nativeInitialState = window.__bridgeInitialState__ ?? {};

  const instance = new BridgeInstance(
    options,
    emitter,
    bridgeMethods,
    nativeInitialState
  );

  const { onReady } = options;

  onReady?.(instance);
  return instance;
};
