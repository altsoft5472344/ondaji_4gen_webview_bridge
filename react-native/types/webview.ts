import type { Component } from "react";
import type WebView from "react-native-webview";
import type { WebViewProps } from "react-native-webview";

/** 
 * 웹뷰의 컴포넌트 props 타입을 제외하고 기능적 메서드만 사용하기 위함
 * ex) webView의 고유 메서드(injectJavaScript, reload)
 */
export type BridgeWebView = Pick<
  WebView,
  Exclude<keyof WebView, keyof Component<WebViewProps>>
>;
