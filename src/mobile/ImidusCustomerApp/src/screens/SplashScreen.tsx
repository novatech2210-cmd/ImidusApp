import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.brandText}>Imidus</Text>
      <Text style={styles.subtitle}>Customer Ordering</Text>
      <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
  },
  brandText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.white,
    marginBottom: Spacing.xl,
  },
  loader: {
    marginTop: Spacing.lg,
  },
});

export default SplashScreen;
