/**
 * Web stub for react-native-linear-gradient
 * Provides a CSS gradient fallback for web preview
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface LinearGradientProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
  style?: ViewStyle;
  children?: React.ReactNode;
}

const LinearGradient: React.FC<LinearGradientProps> = ({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
  children,
}) => {
  // Calculate angle from start/end points
  const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI) + 90;

  const gradientStyle: ViewStyle = {
    ...StyleSheet.flatten(style),
    // @ts-ignore - web-specific CSS
    backgroundImage: `linear-gradient(${angle}deg, ${colors.join(', ')})`,
  };

  return <View style={gradientStyle}>{children}</View>;
};

export default LinearGradient;
