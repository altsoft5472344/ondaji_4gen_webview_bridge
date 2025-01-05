import type {
  Bridge,
  BridgeStore,
  Primitive,
} from "../types";
import type React from "react";
import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import type { WebViewMessageEvent, WebViewProps } from "react-native-webview";
import WebView from "react-native-webview";

import {
  INJECT_BRIDGE_METHODS,
  INJECT_BRIDGE_STATE,
  SAFE_NATIVE_EMITTER_EMIT,
  handleBridge,
} from "./integrations/bridge";
import { INJECT_DEBUG, type LogType, handleLog } from "./integrations/console";
import type { BridgeWebView } from "./types/webview";

export type CreateWebViewArgs<
  BridgeObject extends Bridge,
> = {
  bridge: BridgeStore<BridgeObject>;
  debug?: boolean;
  fallback?: (method: keyof BridgeObject) => void;
};

export type WebMethod<T> = T & {
  isReady: boolean;
};

export const createWebView = <
  BridgeObject extends Bridge,
>({
  bridge,
  debug,
}: CreateWebViewArgs<BridgeObject>) => {
  console.log("===== createWebView =====");


  const webviewRefList: React.RefObject<BridgeWebView>[] = [];

  bridge.subscribe((state) => {
    console.log("bridge.subscribe((state)", state);
    for (const ref of webviewRefList) {
      ref?.current?.injectJavaScript(
        SAFE_NATIVE_EMITTER_EMIT("bridgeStateChange", state)
      );
    }
  });

  return {

    postMessage: <
      EventName,
    >(
      eventName: EventName,
      args: any,
      options: {
        broadcast: boolean;
      } = {
        broadcast: false,
      }
    ) => {
      console.log("===== createWebView // postMessage =====");

      let _args: any = args;
   
      if (options.broadcast) {
        for (const ref of webviewRefList) {
          ref?.current?.injectJavaScript(
            SAFE_NATIVE_EMITTER_EMIT(`postMessage/${String(eventName)}`, _args)
          );
        }
        return;
      }

      const lastRef = webviewRefList[webviewRefList.length - 1];
      lastRef?.current?.injectJavaScript(
        SAFE_NATIVE_EMITTER_EMIT(`postMessage/${String(eventName)}`, _args)
      );
    },
    WebView: forwardRef<BridgeWebView, WebViewProps>(function BridgeWebView(
      props,
      ref
    ) {
      const webviewRef = useRef<WebView>(null);

      console.log("===== createWebView // WebView =====");

      /** Webview 인스턴스가 생성될때마다, 생성된 인스턴스의 ref를 webviewRefList에 추가합니다. */
      useLayoutEffect(() => {
      console.log("===== createWebView // WebView // useLayoutEffect =====");

        webviewRefList.push(webviewRef);
        return () => {
          webviewRefList.pop();
        };
      }, []);

      const initData = useMemo(() => {
        console.log("===== createWebView // WebView // initData =====");

        const bridgeMethods = Object.entries(bridge.getState() ?? {})
          .filter(([_, bridge]) => typeof bridge === "function")
          .map(([name]) => name);
        const initialState = Object.fromEntries(
          Object.entries(bridge.getState() ?? {}).filter(
            ([_, value]) => typeof value !== "function"
          )
        ) as Record<string, Primitive>;
        return { bridgeMethods, initialState };
      }, []);

      useEffect(() => {
        console.log("===== createWebView // WebView // useEffect // hydrate =====");

        webviewRef.current?.injectJavaScript(
          SAFE_NATIVE_EMITTER_EMIT("hydrate", initData)
        );
      }, [initData]);

      const handleMessage = async (event: WebViewMessageEvent) => {
        /** 부모 컴포넌트에서 전달된 onMessage 핸들러가 있다면 실행 */
        props.onMessage?.(event);

        if (!webviewRef.current) {
          return;
        }

        /** 
         * WebView에서 전달된 메시지를 파싱
         * 예: { type: "bridge", body: { method: "openBrowser", args: ["https://..."] }, bridgeId: "webview-1" }
         */
        const { type, body } = JSON.parse(event.nativeEvent.data);

        switch (type) {
          case "log": {
            const { method, args } = body as {
              method: LogType;
              args: string;
            };
            debug && handleLog(method, args);
            return;
          }
          case "bridge": {
            const { method, args } = body as {
              method: string;
              args: unknown[];
            };

            handleBridge({
              bridge,
              method,
              args,
            });
            return;
          }
        }
      };

      return (
        <WebView
          {...props}
          ref={webviewRef}
          onMessage={handleMessage}
          injectedJavaScriptBeforeContentLoaded={[
            INJECT_BRIDGE_METHODS(initData.bridgeMethods),
            INJECT_BRIDGE_STATE(initData.initialState),
            props.injectedJavaScriptBeforeContentLoaded,
            "true;",
          ]
            .filter(Boolean)
            .join("\n")}
          injectedJavaScript={[
            debug && INJECT_DEBUG,
            props.injectedJavaScript,
            "true;",
          ]
            .filter(Boolean)
            .join("\n")}
        />
      );
    }),
  };
};
