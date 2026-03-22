/**
 * Web stub for @react-native-masked-view/masked-view
 */
import React from 'react';
import { View, ViewStyle } from 'react-native';

interface MaskedViewProps {
  maskElement: React.ReactElement;
  children: React.ReactNode;
  style?: ViewStyle;
}

const MaskedView: React.FC<MaskedViewProps> = ({ children, style }) => {
  // Web fallback: just render children without masking
  return <View style={style}>{children}</View>;
};

export default MaskedView;
