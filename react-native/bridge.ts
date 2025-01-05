import type { Bridge, BridgeStore, OnlyJSON, Primitive } from '../types';

export type StoreCallback<T> = ({
  get,
  set,
}: {
  get: () => T;
  set: (newState: Partial<OnlyJSON<T>>) => void;
  /**
   * OnlyJSON을 사용한 이유 직렬화 하기 위해서
   * 직렬화를 한 이유 WebView와 네이티브 앱은 문자열 형태로만 통신 가능
   * 직렬화가 가능한지 확인해야함.
   */
}) => T;

export const bridge = <T extends Bridge>(procedures: T | StoreCallback<T>): BridgeStore<T> => {
  console.log('===== bridge =====');

  const getState = () => {
    console.log('===== bridge // getState =====');
    return state;
  };

  const setState = (newState: Partial<OnlyJSON<T>>) => {
    console.log('===== bridge // setState =====');

    const _newState = {
      ...state,
      ...newState,
    };

    const prevState = state;
    state = _newState;

    /** emitChange는 상태가 변경되었을 때 등록된 모든 리스너들에게 알리는 함수 */
    emitChange(state, prevState);
  };

  let state: T =
    typeof procedures === 'function'
      ? procedures({
          get: getState,
          set: setState,
        })
      : procedures;

  /** 상태 변경 리스너 관리  */
  const listeners = new Set<(newState: T, prevState: T) => void>();

  /** 상태 변경 시 리스너들에게 알림 */
  const emitChange = (newState: T, prevState: T) => {
    console.log('===== bridge // emitChange =====');

    for (const listener of listeners) {
      listener(newState, prevState);
    }
  };

  /** 리스너 구독 및 해제 함수 */
  const subscribe = (listener: (newState: T, prevState: T) => void) => {
    console.log('===== bridge // subscribe =====');

    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    getState,
    setState,
    subscribe,
  } as BridgeStore<T>;
};

interface HandleBridgeArgs<ArgType = unknown> {
  bridge: BridgeStore<Bridge>;
  method: string;
  args?: ArgType[];
}

export const handleBridge = async ({ bridge, method, args }: HandleBridgeArgs) => {
  console.log('===== bridge // handleBridge =====');

  const _bridge = bridge.getState();

  const _method = _bridge[method];

  if (typeof _method !== 'function') {
    return;
  }

  try {
    await _method?.(...(args ?? []));
  } catch (error) {
    console.error(error);
  }
};

export const INJECT_BRIDGE_METHODS = (bridgeNames: string[]) => {
  console.log('===== bridge // INJECT_BRIDGE_METHODS =====');

  return `window.__bridgeMethods__ = ${JSON.stringify(bridgeNames)};`;
};

export const INJECT_BRIDGE_STATE = (initialState: Record<string, Primitive>) => {
  console.log('===== bridge // INJECT_BRIDGE_STATE =====');

  return `window.__bridgeInitialState__ = ${JSON.stringify(initialState)};`;
};

/** 마지막의 true: React Native WebView의 injectJavaScript 메서드는 주입된 JavaScript 코드가 반드시 값을 반환해야 합니다. 이는 WebView의 요구사항입니다. */
export const SAFE_NATIVE_EMITTER_EMIT = (eventName: string, data: unknown) => {
  console.log(`===== bridge // SAFE_NATIVE_EMITTER_EMIT ${eventName} =====`);

  const dataString = JSON.stringify(data);
  return `
if (window.nativeEmitter) {
  window.nativeEmitter.emit('${eventName}', ${dataString});
} 
true;
`;
};
