/**
 * IMIDUS Technologies – Branded App Header
 * Drop-in navigation bar header for use with React Navigation.
 *
 * Usage in navigator options:
 *   header: (props) => <ImidusHeader {...props} />
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import {Colors, Spacing, Shadow, Images} from '@/theme';

interface ImidusHeaderProps {
  title?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

const STATUSBAR_HEIGHT =
  Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
const HEADER_HEIGHT = 56;

export default function ImidusHeader({
  title,
  onBack,
  rightAction,
  transparent = false,
}: ImidusHeaderProps) {
  return (
    <View style={[styles.wrapper, transparent && styles.transparent]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.brandBlue} />

      <View style={styles.bar}>
        {/* Left — back arrow or logo */}
        <View style={styles.left}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backBtn}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
          ) : (
            <Image
              source={Images.logoTriangle}
              style={styles.brandMark}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Centre — screen title */}
        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <Image
            source={Images.logoCompact}
            style={styles.logoCompact}
            resizeMode="contain"
          />
        )}

        {/* Right — slot for icons (cart, profile, etc.) */}
        <View style={styles.right}>
          {rightAction ?? <View style={styles.placeholder} />}
        </View>
      </View>

      {/* Gold accent underline */}
      <View style={styles.goldLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.brandBlue,
    paddingTop: STATUSBAR_HEIGHT,
    ...Shadow.md,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  bar: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  left: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  right: {
    width: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  placeholder: {
    width: 32,
  },

  // Brand mark (when no back button)
  brandMark: {
    width: 28,
    height: 28,
  },

  // Back button
  backBtn: {
    paddingRight: Spacing.sm,
  },
  backArrow: {
    fontSize: 32,
    color: Colors.brandGold,
    fontWeight: '300',
    lineHeight: 36,
  },

  // Screen title
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Logo when no title (home screen)
  logoCompact: {
    flex: 1,
    height: 28,
    alignSelf: 'center',
  },

  // Gold accent line
  goldLine: {
    height: 2.5,
    backgroundColor: Colors.brandGold,
  },
});
