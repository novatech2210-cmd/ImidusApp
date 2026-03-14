import React, {useEffect, useRef} from 'react';
import {Animated, StatusBar, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Colors, Spacing, TextStyles} from '../theme';

const SplashScreen = () => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Animate loading bar
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 100,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [progressAnim, fadeAnim]);

  return (
    <LinearGradient
      colors={[Colors.brandBlue, Colors.brandBlueDark]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Subtle radial highlight effect */}
      <View style={styles.radialHighlight} />

      {/* Logo Section */}
      <Animated.View style={[styles.logoSection, {opacity: fadeAnim}]}>
        <Text style={TextStyles.wordmark}>IMIDUS</Text>
        <Text style={styles.tagline}>
          Seamless Ordering. Real-Time Sync. Unified Loyalty.
        </Text>
      </Animated.View>

      {/* Loading Bar */}
      <View style={styles.loadingContainer}>
        <Animated.View
          style={[
            styles.loadingBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.brandBlue,
    position: 'relative',
    overflow: 'hidden',
  },

  radialHighlight: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -150,
    right: -150,
  },

  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },

  tagline: {
    ...TextStyles.taglineGold,
    marginTop: Spacing.sm,
    width: 250,
    textAlign: 'center',
    lineHeight: 20,
    textTransform: 'none', // Override uppercase for sub-marketing line
  },

  loadingContainer: {
    width: 140,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 80,
  },

  loadingBar: {
    height: '100%',
    backgroundColor: Colors.brandGold,
    borderRadius: 2,
  },
});

export default SplashScreen;
