/**
 * Web stub for react-native-gesture-handler
 */
import {
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  ScrollView,
  FlatList,
  View,
  TextInput,
} from 'react-native';

export {
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  ScrollView,
  FlatList,
  TextInput,
};

export const GestureHandlerRootView = View;
export const PanGestureHandler = View;
export const TapGestureHandler = View;
export const LongPressGestureHandler = View;
export const PinchGestureHandler = View;
export const RotationGestureHandler = View;
export const FlingGestureHandler = View;
export const NativeViewGestureHandler = View;
export const ForceTouchGestureHandler = View;
export const RawButton = TouchableOpacity;
export const BaseButton = TouchableOpacity;
export const RectButton = TouchableOpacity;
export const BorderlessButton = TouchableOpacity;
export const Swipeable = View;
export const DrawerLayout = View;

export const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};

export const Directions = {
  RIGHT: 1,
  LEFT: 2,
  UP: 4,
  DOWN: 8,
};

export const gestureHandlerRootHOC = (Component: any) => Component;
export const createNativeWrapper = (Component: any) => Component;

export default {
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  ScrollView,
  FlatList,
  TextInput,
  GestureHandlerRootView,
  PanGestureHandler,
  TapGestureHandler,
  State,
  Directions,
};
