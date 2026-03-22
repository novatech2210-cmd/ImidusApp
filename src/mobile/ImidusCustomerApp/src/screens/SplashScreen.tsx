import React, {useEffect, useRef} from 'react';
import {Animated, StatusBar, StyleSheet, Text, View} from 'react-native';
import {Colors, Spacing} from '../theme';

const SplashScreen = () => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Fade and scale in content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Animate loading bar
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 100,
          duration: 1800,
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [progressAnim, fadeAnim, scaleAnim, glowAnim]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Animated glow effect */}
      <Animated.View style={[styles.glowCircle, {opacity: glowAnim}]} />
      <Animated.View style={[styles.glowCircle2, {opacity: glowAnim}]} />

      {/* Logo Section */}
      <Animated.View
        style={[
          styles.logoSection,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <Text style={styles.brandName}>IMIDUS</Text>
        <View style={styles.taglineContainer}>
          <View style={styles.dot} />
          <Text style={styles.tagline}>Order</Text>
          <View style={styles.dot} />
          <Text style={styles.tagline}>Track</Text>
          <View style={styles.dot} />
          <Text style={styles.tagline}>Earn</Text>
          <View style={styles.dot} />
        </View>
      </Animated.View>

      {/* Loading indicator */}
      <View style={styles.loadingSection}>
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
        <Text style={styles.loadingText}>Connecting to POS...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    position: 'relative',
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: Colors.brandBlue,
    top: -100,
    right: -100,
    opacity: 0.15,
  },
  glowCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.brandGold,
    bottom: -50,
    left: -50,
    opacity: 0.1,
  },
  logoSection: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 56,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 8,
    textShadowColor: 'rgba(91, 160, 255, 0.3)',
    textShadowOffset: {width: 0, height: 4},
    textShadowRadius: 20,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.brandGold,
    marginHorizontal: Spacing.sm,
  },
  loadingSection: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  loadingContainer: {
    width: 180,
    height: 3,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    backgroundColor: Colors.brandGold,
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
