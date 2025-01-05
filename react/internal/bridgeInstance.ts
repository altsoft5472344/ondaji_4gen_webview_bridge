import type {
  Bridge,
  BridgeStore,
  ExtractStore,
  PrimitiveObject,
} from "../../types";
import { type DefaultEmitter } from "../../utils";

import type { LinkBridgeOptions } from "../linkBridge";
import type { LinkBridge } from "../types";
import { linkBridgeStore } from "./linkBridgeStore";
import { mockStore } from "./mockStore";

export class BridgeInstance<T extends BridgeStore<T extends Bridge ? T : any>> {
  constructor(
    private _options: LinkBridgeOptions<T>,
    private _emitter: DefaultEmitter,
    private _bridgeMethods: string[],
    public _nativeInitialState: PrimitiveObject
  ) {
    console.log("===== bridgeInstance // _hydrate 실행시점 =====");
    this._hydrate(this._bridgeMethods, this._nativeInitialState);
  }

  public store: Omit<T, "setState"> = mockStore() as unknown as Omit<
    T,
    "setState"
  >;

  public addEventListener<EventName>(
    eventName: EventName,
    listener: (args: any) => void
  ) {
    console.log("===== bridgeInstance // addEventListener =====");

    return this._emitter.on(`postMessage/${String(eventName)}`, listener);
  }

  private _postMessage(type: string, body?: unknown) {
    console.log("===== bridgeInstance // _postMessage =====");

    window.ReactNativeWebView?.postMessage(
      JSON.stringify(
        body
          ? {
              type,
              body,
            }
          : {
              type,
            }
      )
    );
  }


  private _createNativeMethod(methodName: string) {
    console.log("===== bridgeInstance // _createNativeMethod =====");

    // 임의의 인자를 받을 수 있는 함수를 반환
    return (...args: unknown[]) => {
      console.log(
        `===== bridgeInstance // _createNativeMethod // evaluate // ${methodName} =====`
      );
      this._postMessage("bridge", {
        method: methodName,
        args,
      });
    };
  }

  public _hydrate(
    bridgeMethods: string[],
    nativeInitialState: PrimitiveObject = {}
  ) {
    console.log("===== bridgeInstance // _hydrate =====");

    const { initialBridge = {} } = this._options;

    const initialMethods = Object.entries(initialBridge).filter(
      ([_, bridge]) => typeof bridge === "function"
    );
    const initialBridgeMethodNames = initialMethods.map(
      ([methodName]) => methodName
    );

    Object.defineProperties(
      this,
      Object.fromEntries(
        initialMethods.map(([methodName, value]) => {
          return [
            methodName,
            {
              value,
              writable: true,
            },
          ];
        })
      )
    );

    this._bridgeMethods = [...bridgeMethods, ...initialBridgeMethodNames];
    this._nativeInitialState = nativeInitialState;

    const nativeMethods = bridgeMethods.reduce((acc, methodName) => {
      console.log("===== bridgeInstance // _hydrate // nativeMethods =====");

      const nativeMethod = this._createNativeMethod(methodName);

      Object.defineProperty(this, methodName, {
        value: nativeMethod,
        writable: false,
      });

      return Object.assign(acc, {
        [methodName]: nativeMethod,
      });
    }, initialBridge as LinkBridge<ExtractStore<T>, Omit<T, "setState">>);

    this.store = linkBridgeStore<T>(this._emitter, {
      ...nativeMethods,
      ...nativeInitialState,
    });

    return true;
  }
}
