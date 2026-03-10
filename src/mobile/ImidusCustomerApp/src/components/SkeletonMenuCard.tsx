import React from 'react';
import {View, StyleSheet} from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

export const SkeletonMenuCard: React.FC = () => (
  <SkeletonPlaceholder borderRadius={8}>
    <SkeletonPlaceholder.Item
      flexDirection="row"
      alignItems="center"
      marginBottom={16}
      paddingHorizontal={16}>
      <SkeletonPlaceholder.Item width={80} height={80} borderRadius={8} />
      <SkeletonPlaceholder.Item marginLeft={12} flex={1}>
        <SkeletonPlaceholder.Item width="80%" height={20} />
        <SkeletonPlaceholder.Item width="60%" height={14} marginTop={8} />
        <SkeletonPlaceholder.Item width="30%" height={18} marginTop={8} />
      </SkeletonPlaceholder.Item>
    </SkeletonPlaceholder.Item>
  </SkeletonPlaceholder>
);

export const SkeletonMenuList: React.FC = () => (
  <View style={styles.container}>
    {[1, 2, 3, 4, 5, 6].map(i => (
      <SkeletonMenuCard key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
});
