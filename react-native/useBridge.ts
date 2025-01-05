import type { Bridge, BridgeStore, ExtractStore } from "../types";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector.js";

export function useBridge<T extends Bridge>(
  store: BridgeStore<T>
): ExtractStore<BridgeStore<T>>;

export function useBridge<
  T extends Bridge,
  U extends ExtractStore<BridgeStore<T>>,
  V
>(store: BridgeStore<T>, selector?: (state: U) => V): V;

export function useBridge<T extends Bridge, U>(
  store: BridgeStore<T>,
  selector?: (state: T) => U
): U {
  console.log("===== react-native // useBridge =====");
  const $selector = selector ?? ((state: T) => state as unknown as U);

  /**
   * store.getState()자체가 리렌더링을 유발하는 것이 아님
   * selector가 선택한 데이터가 실제로 변경되었을 때만 리렌더링 발생
   * 전체 상태가 변경되어도 selector가 선택한 부분이 변경되지 않았다면 리렌더링 안됨
   */

  return useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getState,
    store.getState,
    $selector
  );
}
