/**
 * Web stub for react-native-reanimated
 */
import { Animated } from 'react-native';

export const useSharedValue = (initialValue: any) => ({ value: initialValue });
export const useAnimatedStyle = (fn: () => any) => fn();
export const withTiming = (value: any) => value;
export const withSpring = (value: any) => value;
export const withDecay = (value: any) => value;
export const runOnJS = (fn: any) => fn;
export const runOnUI = (fn: any) => fn;
export const interpolate = (value: any, inputRange: any, outputRange: any) => outputRange[0];
export const Extrapolate = { CLAMP: 'clamp', EXTEND: 'extend' };

export default {
  View: Animated.View,
  Text: Animated.Text,
  Image: Animated.Image,
  ScrollView: Animated.ScrollView,
  createAnimatedComponent: Animated.createAnimatedComponent,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDecay,
  runOnJS,
  runOnUI,
  interpolate,
  Extrapolate,
};
