import type { Bridge, BridgeStore } from "../types";
import type { LinkBridgeOptions } from "./linkBridge";
import { linkBridge } from "./linkBridge";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";

import { useBridge } from "./useBridge";

export interface BridgeProviderProps {
  children: ReactNode;
}

export const createLinkBridgeProvider = <
  T extends BridgeStore<T extends Bridge ? T : any>
>(
  options?: LinkBridgeOptions<T>
) => {
  console.log("===== createLinkBridgeProvider =====");

  const bridge = linkBridge<T>(options);
  const BridgeContext = createContext<BridgeStore | null>(null);

  type BridgeStore = typeof bridge;
  type BridgeSelector = ReturnType<typeof bridge.store.getState>;

  const BridgeProvider = ({ children }: BridgeProviderProps) => {
    console.log("===== createLinkBridgeProvider // BridgeProvider =====");
    const storeRef = useRef<BridgeStore>();
    if (!storeRef.current) {
      storeRef.current = bridge;
    }

    return (
      <BridgeContext.Provider value={storeRef.current}>
        {children}
      </BridgeContext.Provider>
    );
  };

  const useBridgeStore = <U,>(selector: (state: BridgeSelector) => U): U => {
    console.log("===== createLinkBridgeProvider // useBridgeStore =====");
    const bridgeStoreContext = useContext(BridgeContext);

    if (!bridgeStoreContext) {
      throw new Error("useBridgeStore must be used within a BridgeProvider");
    }

    return useBridge(bridgeStoreContext.store, selector as (state: T) => U);
  };

  const useBridgeEventListener = (
    eventName: string,
    listener: (args: any) => void
  ) => {
    console.log(
      "===== createLinkBridgeProvider // useBridgeEventListener ====="
    );
    const bridgeStoreContext = useContext(BridgeContext);

    if (!bridgeStoreContext) {
      throw new Error(
        "useBridgeEventListener must be used within a BridgeProvider"
      );
    }

    useEffect(() => {
      return bridgeStoreContext.addEventListener(eventName, listener);
    }, []);
  };

  return {
    bridge,
    BridgeProvider,
    useBridgeStore,
    useBridgeEventListener,
  };
};
