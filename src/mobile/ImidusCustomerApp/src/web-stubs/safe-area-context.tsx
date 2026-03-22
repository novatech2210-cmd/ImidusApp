/**
 * Web stub for react-native-safe-area-context
 */
import React from 'react';
import { View, ViewStyle } from 'react-native';

interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface Metrics {
  insets: EdgeInsets;
  frame: { x: number; y: number; width: number; height: number };
}

const defaultInsets: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

export const SafeAreaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

export const SafeAreaView: React.FC<{
  children?: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}> = ({ children, style }) => (
  <View style={style}>{children}</View>
);

export const SafeAreaInsetsContext = React.createContext<EdgeInsets | null>(defaultInsets);

export const useSafeAreaInsets = (): EdgeInsets => defaultInsets;

export const useSafeAreaFrame = () => ({
  x: 0,
  y: 0,
  width: typeof window !== 'undefined' ? window.innerWidth : 390,
  height: typeof window !== 'undefined' ? window.innerHeight : 844,
});

export const initialWindowMetrics: Metrics = {
  insets: defaultInsets,
  frame: { x: 0, y: 0, width: 390, height: 844 },
};

export const withSafeAreaInsets = <P extends object>(
  Component: React.ComponentType<P & { insets: EdgeInsets }>
) => {
  return (props: P) => <Component {...props} insets={defaultInsets} />;
};

export default {
  SafeAreaProvider,
  SafeAreaView,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
  useSafeAreaFrame,
  initialWindowMetrics,
  withSafeAreaInsets,
};
