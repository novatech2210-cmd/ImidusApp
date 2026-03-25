/**
 * Web stub for react-native-webview
 * Uses iframe for web preview
 */
import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';

interface WebViewProps {
  source?: {uri?: string; html?: string};
  style?: ViewStyle;
  onMessage?: (event: any) => void;
  onLoadEnd?: () => void;
  onError?: () => void;
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  originWhitelist?: string[];
  mixedContentMode?: string;
  cacheEnabled?: boolean;
  incognito?: boolean;
}

// Web-specific iframe styles (not valid in standard StyleSheet.create)
const iframeStyles = {
  width: '100%',
  height: '100%',
  border: 'none',
};

export const WebView = React.forwardRef<any, WebViewProps>(
  ({source, style, onMessage, onLoadEnd, onError}, ref) => {
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    React.useImperativeHandle(ref, () => ({
      postMessage: (data: string) => {
        iframeRef.current?.contentWindow?.postMessage(data, '*');
      },
    }));

    React.useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        if (onMessage) {
          onMessage({nativeEvent: {data: event.data}});
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [onMessage]);

    if (source?.html) {
      return (
        <View style={[styles.container, style]}>
          <iframe
            ref={iframeRef}
            srcDoc={source.html}
            style={iframeStyles as any}
            onLoad={onLoadEnd}
            onError={onError}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </View>
      );
    }

    if (source?.uri) {
      return (
        <View style={[styles.container, style]}>
          <iframe
            ref={iframeRef}
            src={source.uri}
            style={iframeStyles as any}
            onLoad={onLoadEnd}
            onError={onError}
          />
        </View>
      );
    }

    return <View style={style} />;
  },
);

export type WebViewMessageEvent = {
  nativeEvent: {data: string};
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default WebView;
