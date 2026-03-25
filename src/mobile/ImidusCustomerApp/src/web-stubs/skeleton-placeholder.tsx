/**
 * Web stub for react-native-skeleton-placeholder
 */
import React from 'react';
import {DimensionValue, StyleSheet, View, ViewStyle} from 'react-native';

interface SkeletonPlaceholderProps {
  backgroundColor?: string;
  highlightColor?: string;
  speed?: number;
  children?: React.ReactNode;
}

interface SkeletonItemProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

const SkeletonPlaceholder: React.FC<SkeletonPlaceholderProps> & {
  Item: React.FC<SkeletonItemProps>;
} = ({backgroundColor = '#E1E9EE', children}) => {
  return <View style={[styles.container, {backgroundColor}]}>{children}</View>;
};

const SkeletonItem: React.FC<SkeletonItemProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  return (
    <View
      style={[
        styles.item,
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E1E9EE',
        },
        style,
      ]}
    />
  );
};

SkeletonPlaceholder.Item = SkeletonItem;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  item: {
    backgroundColor: '#E1E9EE',
  },
});

export default SkeletonPlaceholder;
